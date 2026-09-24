import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProspectStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";

type ScannerProspect = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function intValue(value: unknown) {
  const parsed = numberValue(value);
  return parsed == null ? null : Math.round(parsed);
}

function boolValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }
  return null;
}

function normalizeStatus(value: unknown, website: string | null, websiteScore: number | null): ProspectStatus {
  const raw = typeof value === "string" ? value.trim().toUpperCase() : "";

  const direct: ProspectStatus[] = [
    "NO_WEBSITE",
    "BROKEN_WEBSITE",
    "OLD_WEBSITE",
    "WEAK_WEBSITE",
    "GOOD_WEBSITE",
    "IGNORED",
    "IMPORTED",
  ];

  if (direct.includes(raw as ProspectStatus)) {
    return raw as ProspectStatus;
  }

  if (raw.includes("NO WEBSITE")) return "NO_WEBSITE";
  if (raw.includes("BROKEN")) return "BROKEN_WEBSITE";
  if (raw.includes("OLD")) return "OLD_WEBSITE";
  if (raw.includes("WEAK")) return "WEAK_WEBSITE";
  if (raw.includes("GOOD")) return "GOOD_WEBSITE";

  if (!website) return "NO_WEBSITE";
  if ((websiteScore ?? 0) >= 50) return "OLD_WEBSITE";
  if ((websiteScore ?? 0) >= 20) return "WEAK_WEBSITE";
  return "GOOD_WEBSITE";
}

function normalizeReasons(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function mapScannerProspect(item: ScannerProspect) {
  const placeId = text(item.place_id) || text(item.placeId);
  const name = text(item.name) || text(item.business);

  if (!placeId || !name) return null;

  const website = text(item.website);
  const websiteScore = intValue(item.website_score ?? item.websiteScore);
  const status = normalizeStatus(item.status, website, websiteScore);

  return {
    placeId,
    name,
    city: text(item.city),
    category: text(item.category),
    address: text(item.address),
    website,
    email: text(item.email),
    websitePhone: text(item.website_phone ?? item.websitePhone),
    googlePhone: text(item.google_phone ?? item.googlePhone),
    contactPage: text(item.contact_page ?? item.contactPage),
    contactForm: boolValue(item.contact_form ?? item.contactForm) ?? false,
    facebook: text(item.facebook),
    instagram: text(item.instagram),
    linkedin: text(item.linkedin),
    rating: numberValue(item.rating),
    reviews: intValue(item.reviews),
    status,
    leadScore: intValue(item.lead_score ?? item.leadScore) ?? 0,
    websiteScore,
    reasons: normalizeReasons(item.reasons),
    https: boolValue(item.https),
    mobile: boolValue(item.mobile),
    copyrightYear: intValue(item.copyright ?? item.copyrightYear),
    loadSeconds: numberValue(item.load_seconds ?? item.loadSeconds),
    pageTitle: text(item.title ?? item.pageTitle),
    httpStatus: intValue(item.http ?? item.httpStatus),
    googleMapsUrl: text(item.maps ?? item.googleMapsUrl),
    source: text(item.source) || "google_places",
    scannedAt: new Date(),
  };
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawItems = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { prospects?: unknown }).prospects)
      ? (body as { prospects: unknown[] }).prospects
      : null;

  if (!rawItems) {
    return NextResponse.json(
      { error: "Expected an array or { prospects: [...] }" },
      { status: 400 },
    );
  }

  if (rawItems.length > 1000) {
    return NextResponse.json({ error: "Maximum 1000 prospects per import" }, { status: 413 });
  }

  const mapped = rawItems
    .filter((item): item is ScannerProspect => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map(mapScannerProspect)
    .filter((item): item is NonNullable<ReturnType<typeof mapScannerProspect>> => item !== null);

  let imported = 0;

  for (let offset = 0; offset < mapped.length; offset += 50) {
    const chunk = mapped.slice(offset, offset + 50);

    await prisma.$transaction(
      chunk.map((prospect) =>
        prisma.prospect.upsert({
          where: { placeId: prospect.placeId },
          update: {
            ...prospect,
            // Never undo an explicit CRM decision during a scanner refresh.
            status: undefined,
          },
          create: prospect,
        }),
      ),
    );

    // Refresh scanner-derived status only for prospects that are still in discovery.
    await Promise.all(
      chunk.map((prospect) =>
        prisma.prospect.updateMany({
          where: {
            placeId: prospect.placeId,
            status: {
              notIn: ["IGNORED", "IMPORTED"],
            },
          },
          data: { status: prospect.status },
        }),
      ),
    );

    imported += chunk.length;
  }

  return NextResponse.json({
    ok: true,
    imported,
    skipped: rawItems.length - mapped.length,
  });
}
