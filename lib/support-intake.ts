import {
  createHash,
  randomUUID,
} from "node:crypto";

import type {
  SupportCategory,
  SupportPriority,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hashIdentifier } from "@/lib/request-security";

export const SUPPORT_MAX_BYTES = 64 * 1024;

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const categories: SupportCategory[] = [
  "WEBSITE",
  "HOSTING",
  "EMAIL",
  "BUG",
  "CHANGE",
  "OTHER",
];

const priorities: SupportPriority[] = [
  "NORMAL",
  "URGENT",
];

type NormalizedSupportInput = {
  name: string;
  email: string;
  company: string;
  website: string;
  title: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
};

export type SupportSubmissionResult =
  | {
      kind: "success";
      reference: string;
      created: boolean;
      supportRequestId?: string;
      clientId?: string | null;
      notification?: {
        name: string;
        title: string;
        priority: SupportPriority;
      };
    }
  | {
      kind: "invalid";
      message: string;
    }
  | {
      kind: "rate_limited";
      retryAfter: number;
    };

function boundedText(
  input: unknown,
  max: number
): string | null {
  if (input === undefined || input === null) {
    return "";
  }

  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim();

  return value.length <= max ? value : null;
}

function normalize(
  body: Record<string, unknown>
): NormalizedSupportInput | null {
  const name = boundedText(body.name, 120);
  const email = boundedText(body.email, 320);
  const company = boundedText(body.company, 160);
  const website = boundedText(body.website, 300);
  const title = boundedText(body.title, 160);
  const description = boundedText(body.description, 10000);
  const category = boundedText(body.category, 40);
  const priority = boundedText(body.priority, 40);

  if (
    name === null ||
    email === null ||
    company === null ||
    website === null ||
    title === null ||
    description === null ||
    category === null ||
    priority === null
  ) {
    return null;
  }

  const normalizedEmail = email.toLowerCase();

  if (
    name.length < 2 ||
    !emailPattern.test(normalizedEmail) ||
    title.length < 2 ||
    description.length < 10 ||
    !categories.includes(
      category as SupportCategory
    ) ||
    !priorities.includes(
      priority as SupportPriority
    )
  ) {
    return null;
  }

  return {
    name,
    email: normalizedEmail,
    company,
    website,
    title,
    description,
    category: category as SupportCategory,
    priority: priority as SupportPriority,
  };
}

function fingerprint(
  input: NormalizedSupportInput
) {
  return createHash("sha256")
    .update(
      [
        input.email,
        input.title,
        input.description,
        input.category,
        input.priority,
      ].join("\u0000")
    )
    .digest("hex");
}

function reference() {
  return `SUP-${randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase()}`;
}

export async function submitSupportRequest(
  body: Record<string, unknown>,
  context: {
    ip: string | null;
  }
): Promise<SupportSubmissionResult> {
  const globalLimit = await consumeRateLimit({
    key: "support:global",
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (!globalLimit.allowed) {
    return {
      kind: "rate_limited",
      retryAfter: globalLimit.retryAfter,
    };
  }

  if (context.ip) {
    const ipLimit = await consumeRateLimit({
      key: `support:ip:${hashIdentifier(
        context.ip
      )}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!ipLimit.allowed) {
      return {
        kind: "rate_limited",
        retryAfter: ipLimit.retryAfter,
      };
    }
  }

  if (
    typeof body.fax === "string" &&
    body.fax.trim()
  ) {
    return {
      kind: "success",
      reference: "SUP-RECEIVED",
      created: false,
    };
  }

  const input = normalize(body);

  if (!input) {
    return {
      kind: "invalid",
      message:
        "Kontrollera namn, e-post, kategori och beskrivning.",
    };
  }

  const emailLimit = await consumeRateLimit({
    key: `support:email:${hashIdentifier(
      input.email
    )}`,
    limit: 3,
    windowMs: 10 * 60 * 1000,
  });

  if (!emailLimit.allowed) {
    return {
      kind: "rate_limited",
      retryAfter: emailLimit.retryAfter,
    };
  }

  const duplicateKey = `support:duplicate:${fingerprint(
    input
  )}`;

  const result = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw<
        Array<{ acquired: number }>
      >`
        SELECT 1::int AS acquired
        FROM pg_advisory_xact_lock(
          hashtextextended(${duplicateKey}, 0)
        )
      `;

      const existing =
        await tx.supportRequest.findFirst({
          where: {
            requesterEmail: input.email,
            title: input.title,
            description: input.description,
            category: input.category,
            priority: input.priority,
            createdAt: {
              gte: new Date(
                Date.now() -
                  DUPLICATE_WINDOW_MS
              ),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            reference: true,
            clientId: true,
          },
        });

      if (existing) {
        return {
          kind: "success" as const,
          reference:
            existing.reference ??
            "SUP-RECEIVED",
          created: false,
          supportRequestId: existing.id,
          clientId: existing.clientId,
        };
      }

      const client = await tx.client.findFirst({
        where: {
          OR: [
            {
              billingEmail: {
                equals: input.email,
                mode: "insensitive",
              },
            },
            {
              contacts: {
                some: {
                  email: {
                    equals: input.email,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
        },
      });

      let ticketReference = reference();

      while (
        await tx.supportRequest.findUnique({
          where: {
            reference: ticketReference,
          },
          select: {
            id: true,
          },
        })
      ) {
        ticketReference = reference();
      }

      const created =
        await tx.supportRequest.create({
          data: {
            clientId: client?.id ?? null,
            reference: ticketReference,
            requesterName: input.name,
            requesterEmail: input.email,
            requesterCompany:
              input.company || null,
            requesterWebsite:
              input.website || null,
            title: input.title,
            description: input.description,
            category: input.category,
            priority: input.priority,
            status: "OPEN",
            coverage: "UNASSESSED",
            timeSpentMinutes: 0,
          },
          select: {
            id: true,
            clientId: true,
            reference: true,
          },
        });

      return {
        kind: "success" as const,
        reference:
          created.reference ??
          ticketReference,
        created: true,
        supportRequestId: created.id,
        clientId: created.clientId,
        notification: {
          name: input.name,
          title: input.title,
          priority: input.priority,
        },
      };
    }
  );

  return result;
}
