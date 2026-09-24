"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ConvertLeadState = {
  error: string | null;
};

class ConversionConflict extends Error {}

export async function convertLeadToClient(
  _previousState: ConvertLeadState,
  formData: FormData
): Promise<ConvertLeadState> {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const leadId = formData.get("leadId");
  const submittedName = formData.get("clientName");

  if (
    typeof leadId !== "string" ||
    !leadId.trim() ||
    typeof submittedName !== "string"
  ) {
    return { error: "Enter a client name." };
  }

  const clientName = submittedName.trim();

  if (clientName.length < 2 || clientName.length > 160) {
    return { error: "Client name must contain 2–160 characters." };
  }

  let result: ConvertLeadState;

  try {
    result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          status: true,
          clientId: true,
          contactId: true,
        },
      });

      if (!lead) {
        return { error: "Lead not found." };
      }

      if (lead.clientId) {
        return { error: null };
      }

      if (lead.status === "LOST") {
        return { error: "A lost lead cannot be linked to a client record." };
      }

      const client = await tx.client.create({
        data: {
          name: clientName,
          contacts: {
            connect: { id: lead.contactId },
          },
        },
      });

      const updated = await tx.lead.updateMany({
        where: {
          id: lead.id,
          clientId: null,
        },
        data: {
          clientId: client.id,
        },
      });

      if (updated.count !== 1) {
        throw new ConversionConflict();
      }

      return { error: null };
    });
  } catch (error) {
    if (error instanceof ConversionConflict) {
      return {
        error: "This lead was linked in another request. Refresh the page.",
      };
    }

    throw error;
  }

  if (result.error) {
    return result;
  }

  revalidatePath("/hub/leads");
  revalidatePath(`/hub/leads/${leadId}`);
  revalidatePath("/hub/clients");
  redirect(`/hub/leads/${leadId}`);
}
