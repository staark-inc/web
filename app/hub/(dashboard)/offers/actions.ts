"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { OfferStatus } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type OfferActionState = { error: string | null; success: boolean };

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");
}

function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseOre(value: string): number | null | undefined {
  if (!value) return null;
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(normalized)) return undefined;
  const [whole, fractional = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fractional.padEnd(2, "0"));
}

type OfferFields = {
  title: string;
  scope: string | null;
  terms: string | null;
  oneTimePriceOre: number | null;
  monthlyPriceOre: number | null;
  includedMonths: number;
};

function readOffer(data: FormData): { error: string } | { data: OfferFields } {
  const title = field(data, "title");
  const scope = field(data, "scope");
  const terms = field(data, "terms");
  const oneTimePriceOre = parseOre(field(data, "oneTimePrice"));
  const monthlyPriceOre = parseOre(field(data, "monthlyPrice"));
  const monthsValue = field(data, "includedMonths");
  const includedMonths = Number(monthsValue);

  if (title.length < 2 || title.length > 160) return { error: "Use a title between 2 and 160 characters." };
  if (scope.length > 10000 || terms.length > 5000) return { error: "Scope or terms are too long." };
  if (oneTimePriceOre === undefined || monthlyPriceOre === undefined) return { error: "Enter prices in SEK with at most two decimals." };
  if (!/^\d+$/.test(monthsValue) || !Number.isInteger(includedMonths) || includedMonths > 36) {
    return { error: "Included support must be between 0 and 36 months." };
  }

  return {
    data: {
      title,
      scope: scope || null,
      terms: terms || null,
      oneTimePriceOre,
      monthlyPriceOre,
      includedMonths,
    },
  };
}

export async function createOffer(_state: OfferActionState, formData: FormData): Promise<OfferActionState> {
  await requireAdmin();
  const clientId = field(formData, "clientId");
  const result = readOffer(formData);
  if ("error" in result) return { error: result.error, success: false };

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return { error: "Select an existing client.", success: false };

  let offerId: string;
  try {
    const offer = await prisma.offer.create({ data: { clientId, ...result.data }, select: { id: true } });
    offerId = offer.id;
  } catch (error) {
    console.error("[HUB] Could not create offer:", error);
    return { error: "Could not create the offer.", success: false };
  }

  revalidatePath("/hub/offers");
  revalidatePath(`/hub/clients/${clientId}`);
  redirect(`/hub/offers/${offerId}`);
}

export async function updateOffer(_state: OfferActionState, formData: FormData): Promise<OfferActionState> {
  await requireAdmin();
  const offerId = field(formData, "offerId");
  const result = readOffer(formData);
  if ("error" in result) return { error: result.error, success: false };

  const updated = await prisma.offer.updateMany({
    where: { id: offerId, status: "DRAFT" },
    data: result.data,
  });
  if (updated.count !== 1) return { error: "Only draft offers can be edited. Reload the page.", success: false };

  revalidatePath("/hub/offers");
  revalidatePath(`/hub/offers/${offerId}`);
  return { error: null, success: true };
}

export async function changeOfferStatus(_state: OfferActionState, formData: FormData): Promise<OfferActionState> {
  await requireAdmin();
  const offerId = field(formData, "offerId");
  const next = field(formData, "status") as OfferStatus;
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) return { error: "Offer not found.", success: false };

  const allowed: Record<OfferStatus, OfferStatus[]> = {
    DRAFT: ["SHARED"],
    SHARED: ["DRAFT"],
    VIEWED: ["DRAFT"],
    ACCEPTED: [],
    DECLINED: [],
  };

  if (!allowed[offer.status].includes(next)) return { error: "That status change is not available.", success: false };
  if (next === "SHARED" && (!offer.scope || (offer.oneTimePriceOre === null && offer.monthlyPriceOre === null))) {
    return { error: "Add the scope and at least one price before marking an offer as shared.", success: false };
  }

  const updated = await prisma.offer.updateMany({
    where: { id: offerId, status: offer.status },
    data: {
      status: next,
      shareToken:
        next === "SHARED"
          ? offer.shareToken ?? randomUUID()
          : offer.shareToken,
      sharedAt:
        next === "DRAFT"
          ? null
          : next === "SHARED"
            ? new Date()
            : offer.sharedAt,
      viewedAt:
        next === "DRAFT"
          ? null
          : offer.viewedAt,
      decidedAt: null,
    },
  });
  if (updated.count !== 1) return { error: "The offer changed while you were editing. Reload the page.", success: false };

  revalidatePath("/hub/offers");
  revalidatePath(`/hub/offers/${offerId}`);
  revalidatePath(`/hub/clients/${offer.clientId}`);
  return { error: null, success: true };
}
