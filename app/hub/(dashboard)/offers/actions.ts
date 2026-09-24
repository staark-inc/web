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

function clientNameForLead(contact: {
  company: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}) {
  return contact.company || contact.name || contact.email || contact.phone || "New client";
}

export async function createOffer(_state: OfferActionState, formData: FormData): Promise<OfferActionState> {
  await requireAdmin();

  const submittedClientId = field(formData, "clientId");
  const leadId = field(formData, "leadId");
  const result = readOffer(formData);
  if ("error" in result) return { error: result.error, success: false };

  let offerId: string;
  let clientId: string;

  try {
    const created = await prisma.$transaction(async (tx) => {
      if (leadId) {
        const lead = await tx.lead.findUnique({
          where: { id: leadId },
          select: {
            id: true,
            status: true,
            clientId: true,
            contactId: true,
            contact: {
              select: {
                name: true,
                company: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        if (!lead) throw new Error("LEAD_NOT_FOUND");
        if (lead.status === "LOST") throw new Error("LEAD_LOST");
        if (lead.status === "WON") throw new Error("LEAD_WON");

        let linkedClientId = lead.clientId;

        if (!linkedClientId) {
          const client = await tx.client.create({
            data: {
              name: clientNameForLead(lead.contact),
              billingEmail: lead.contact.email,
              phone: lead.contact.phone,
              contacts: {
                connect: { id: lead.contactId },
              },
            },
            select: { id: true },
          });

          linkedClientId = client.id;
        }

        await tx.lead.update({
          where: { id: lead.id },
          data: {
            clientId: linkedClientId,
            status: "QUALIFIED",
          },
        });

        const offer = await tx.offer.create({
          data: {
            clientId: linkedClientId,
            leadId: lead.id,
            ...result.data,
          },
          select: { id: true },
        });

        return { offerId: offer.id, clientId: linkedClientId, leadId: lead.id };
      }

      const client = await tx.client.findUnique({
        where: { id: submittedClientId },
        select: { id: true },
      });

      if (!client) throw new Error("CLIENT_NOT_FOUND");

      const offer = await tx.offer.create({
        data: {
          clientId: client.id,
          ...result.data,
        },
        select: { id: true },
      });

      return { offerId: offer.id, clientId: client.id, leadId: null };
    });

    offerId = created.offerId;
    clientId = created.clientId;

    if (created.leadId) {
      revalidatePath("/hub/leads");
      revalidatePath(`/hub/leads/${created.leadId}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "LEAD_NOT_FOUND") return { error: "Lead not found.", success: false };
      if (error.message === "LEAD_LOST") return { error: "A lost lead cannot be used to create an offer.", success: false };
      if (error.message === "LEAD_WON") return { error: "This lead is already won.", success: false };
      if (error.message === "CLIENT_NOT_FOUND") return { error: "Select an existing client.", success: false };
    }

    console.error("[HUB] Could not create offer:", error);
    return { error: "Could not create the offer.", success: false };
  }

  revalidatePath("/hub/offers");
  revalidatePath("/hub/clients");
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

export async function deleteOffer(formData: FormData) {
  await requireAdmin();

  const offerId = field(formData, "offerId");

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      clientId: true,
      status: true,
      project: {
        select: { id: true },
      },
    },
  });

  if (!offer) {
    redirect("/hub/offers");
  }

  if (offer.project) {
    throw new Error("Offers linked to a project cannot be deleted.");
  }

  if (!["DRAFT", "DECLINED"].includes(offer.status)) {
    throw new Error("Only draft or declined offers can be deleted.");
  }

  await prisma.offer.delete({
    where: { id: offer.id },
  });

  revalidatePath("/hub/offers");
  revalidatePath(`/hub/clients/${offer.clientId}`);

  redirect("/hub/offers");
}
