import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type {
  SupportCategory,
  SupportPriority,
} from "@/generated/prisma/client";
import { createAdminNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

type RateEntry = {
  count: number;
  resetAt: number;
};

const globalForSupport = globalThis as typeof globalThis & {
  staarkSupportRate?: Map<string, RateEntry>;
};

const rateStore = globalForSupport.staarkSupportRate ?? new Map<string, RateEntry>();
globalForSupport.staarkSupportRate = rateStore;

function value(input: unknown, max: number) {
  return typeof input === "string" ? input.trim().slice(0, max) : "";
}

function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function rateLimited(request: Request) {
  const key = clientIp(request);
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const current = rateStore.get(key);

  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > 5;
}

function reference() {
  return `SUP-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  if (rateLimited(request)) {
    return NextResponse.json(
      { error: "För många supportärenden. Vänta en stund och försök igen." },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (value(body.fax, 200)) {
      return NextResponse.json({ ok: true, reference: "SUP-RECEIVED" });
    }

    const name = value(body.name, 120);
    const email = value(body.email, 320).toLowerCase();
    const company = value(body.company, 160);
    const website = value(body.website, 300);
    const title = value(body.title, 160);
    const description = value(body.description, 10000);
    const category = value(body.category, 40) as SupportCategory;
    const priority = value(body.priority, 40) as SupportPriority;

    if (
      name.length < 2 ||
      !emailPattern.test(email) ||
      title.length < 2 ||
      description.length < 10 ||
      !categories.includes(category) ||
      !priorities.includes(priority)
    ) {
      return NextResponse.json(
        { error: "Kontrollera namn, e-post, kategori och beskrivning." },
        { status: 400 }
      );
    }

    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { billingEmail: { equals: email, mode: "insensitive" } },
          { contacts: { some: { email: { equals: email, mode: "insensitive" } } } },
        ],
      },
      select: { id: true },
    });

    let ticketReference = reference();

    while (
      await prisma.supportRequest.findUnique({
        where: { reference: ticketReference },
        select: { id: true },
      })
    ) {
      ticketReference = reference();
    }

    const supportRequest = await prisma.supportRequest.create({
      data: {
        clientId: client?.id ?? null,
        reference: ticketReference,
        requesterName: name,
        requesterEmail: email,
        requesterCompany: company || null,
        requesterWebsite: website || null,
        title,
        description,
        category,
        priority,
        status: "OPEN",
        coverage: "UNASSESSED",
        timeSpentMinutes: 0,
      },
      select: { id: true, clientId: true, reference: true },
    });

    await createAdminNotification({
      type: "support.created",
      title: "New support request",
      message: `${name} · ${title}`,
      href: `/hub/support/${supportRequest.id}`,
      metadata: {
        supportRequestId: supportRequest.id,
        reference: supportRequest.reference,
        priority,
      },
      dedupeKey: `support:${supportRequest.id}`,
    });

    revalidatePath("/hub/support");
    if (supportRequest.clientId) revalidatePath(`/hub/clients/${supportRequest.clientId}`);

    return NextResponse.json({ ok: true, reference: supportRequest.reference });
  } catch (error) {
    console.error("[SUPPORT] Public intake failed:", error);
    return NextResponse.json(
      { error: "Supportärendet kunde inte skickas. Försök igen." },
      { status: 500 }
    );
  }
}
