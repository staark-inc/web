"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ContactChannel } from "@/generated/prisma/client";

async function requireAdmin() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

function normalize(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value: string | null | undefined) {
  return normalize(value)?.toLowerCase() ?? null;
}

function normalizePhone(value: string | null | undefined) {
  return normalize(value);
}

function normalizeFacebook(value: string | null | undefined) {
  return normalize(value);
}

function isContactChannel(value: unknown): value is ContactChannel {
  return value === "EMAIL" || value === "WHATSAPP" || value === "FACEBOOK";
}

export async function ignoreProspect(formData: FormData) {
  await requireAdmin();

  const prospectId = formData.get("prospectId");

  if (typeof prospectId !== "string" || !prospectId) {
    return;
  }

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { status: "IGNORED" },
  });

  revalidatePath("/hub/prospects");
}

export async function restoreProspect(formData: FormData) {
  await requireAdmin();

  const prospectId = formData.get("prospectId");

  if (typeof prospectId !== "string" || !prospectId) {
    return;
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: {
      website: true,
      websiteScore: true,
      httpStatus: true,
    },
  });

  if (!prospect) return;

  let status:
    | "NO_WEBSITE"
    | "BROKEN_WEBSITE"
    | "OLD_WEBSITE"
    | "WEAK_WEBSITE"
    | "GOOD_WEBSITE" = "GOOD_WEBSITE";

  if (!prospect.website) status = "NO_WEBSITE";
  else if ((prospect.httpStatus ?? 200) >= 400) status = "BROKEN_WEBSITE";
  else if ((prospect.websiteScore ?? 0) >= 50) status = "OLD_WEBSITE";
  else if ((prospect.websiteScore ?? 0) >= 20) status = "WEAK_WEBSITE";

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { status },
  });

  revalidatePath("/hub/prospects");
}

export async function addProspectToLeads(formData: FormData) {
  await requireAdmin();

  const prospectId = formData.get("prospectId");
  const requestedChannel = formData.get("contactChannel");

  if (typeof prospectId !== "string" || !prospectId) {
    return;
  }

  if (!isContactChannel(requestedChannel)) {
    throw new Error("Choose a valid contact channel before adding this prospect to Leads.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const prospect = await tx.prospect.findUnique({
      where: { id: prospectId },
    });

    if (!prospect) {
      throw new Error("Prospect not found");
    }

    if (prospect.importedLeadId) {
      return prospect.importedLeadId;
    }

    const email = normalizeEmail(prospect.email);
    const phone = normalizePhone(prospect.googlePhone || prospect.websitePhone);
    const facebook = normalizeFacebook(prospect.facebook);

    if (requestedChannel === "EMAIL" && !email) {
      throw new Error("This prospect has no email address.");
    }

    if (requestedChannel === "WHATSAPP" && !phone) {
      throw new Error("This prospect has no phone number for WhatsApp.");
    }

    if (requestedChannel === "FACEBOOK" && !facebook) {
      throw new Error("This prospect has no Facebook profile or page.");
    }

    const matches = [
      email ? { email } : null,
      phone ? { phone } : null,
      facebook ? { facebook } : null,
    ].filter(Boolean) as Array<
      | { email: string }
      | { phone: string }
      | { facebook: string }
    >;

    const existingContact = matches.length
      ? await tx.contact.findFirst({ where: { OR: matches } })
      : null;

    const contact = existingContact
      ? await tx.contact.update({
          where: { id: existingContact.id },
          data: {
            company: existingContact.company || prospect.name,
            email: existingContact.email || email,
            phone: existingContact.phone || phone,
            facebook: existingContact.facebook || facebook,
          },
        })
      : await tx.contact.create({
          data: {
            company: prospect.name,
            email,
            phone,
            facebook,
          },
        });

    const lead = await tx.lead.create({
      data: {
        contactId: contact.id,
        contactChannel: requestedChannel,
        service: "Website / digital presence",
        message: [
          `Imported from Prospects (${prospect.city || "unknown city"}).`,
          `Preferred channel: ${requestedChannel.toLowerCase()}.`,
          prospect.website ? `Website: ${prospect.website}` : "No website detected.",
          prospect.websiteScore != null
            ? `Website score: ${prospect.websiteScore}/100.`
            : null,
        ]
          .filter(Boolean)
          .join(" "),
        status: "NEW",
      },
    });

    await tx.prospect.update({
      where: { id: prospect.id },
      data: {
        status: "IMPORTED",
        importedLeadId: lead.id,
      },
    });

    return lead.id;
  });

  revalidatePath("/hub/prospects");
  revalidatePath("/hub/leads");
  revalidatePath("/hub/contacts");
  redirect(`/hub/leads/${result}`);
}
