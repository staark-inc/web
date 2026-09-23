"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
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

  if (typeof prospectId !== "string" || !prospectId) {
    return;
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

    if (!prospect.email) {
      throw new Error("An email address is required before adding this prospect to Leads.");
    }

    const contact = await tx.contact.upsert({
      where: { email: prospect.email },
      update: {
        company: prospect.name,
        phone: prospect.googlePhone || prospect.websitePhone || undefined,
      },
      create: {
        email: prospect.email,
        company: prospect.name,
        phone: prospect.googlePhone || prospect.websitePhone || undefined,
      },
    });

    const lead = await tx.lead.create({
      data: {
        contactId: contact.id,
        service: "Website / digital presence",
        message: [
          `Imported from Prospects (${prospect.city || "unknown city"}).`,
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
  redirect(`/hub/leads/${result}`);
}
