"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function respondToOffer(
  token: string,
  formData: FormData
) {
  const decision = String(
    formData.get("decision") || ""
  );

  const status =
    decision === "ACCEPTED"
      ? "ACCEPTED"
      : decision === "DECLINED"
        ? "DECLINED"
        : null;

  if (!status) {
    redirect(
      `/offert/${encodeURIComponent(token)}?result=invalid`
    );
  }

  if (
    status === "ACCEPTED" &&
    String(formData.get("acceptTerms") || "") !== "yes"
  ) {
    redirect(
      `/offert/${encodeURIComponent(token)}?result=terms`
    );
  }

  const offer = await prisma.offer.findUnique({
    where: {
      shareToken: token,
    },
    select: {
      id: true,
      clientId: true,
      leadId: true,
      title: true,
      status: true,
      client: {
        select: {
          name: true,
        },
      },
    },
  });

  if (
    !offer ||
    (
      offer.status !== "SHARED" &&
      offer.status !== "VIEWED"
    )
  ) {
    redirect(
      `/offert/${encodeURIComponent(token)}?result=locked`
    );
  }

  const decidedAt = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const offerUpdate = await tx.offer.updateMany({
      where: {
        id: offer.id,
        status: offer.status,
      },
      data: {
        status,
        decidedAt,
        termsAcceptedAt:
          status === "ACCEPTED"
            ? decidedAt
            : null,
        termsVersion:
          status === "ACCEPTED"
            ? "2026-09-22"
            : null,
      },
    });

    if (offerUpdate.count !== 1) {
      return false;
    }

    if (status === "ACCEPTED" && offer.leadId) {
      await tx.lead.update({
        where: { id: offer.leadId },
        data: {
          status: "WON",
          clientId: offer.clientId,
        },
      });
    }

    return true;
  });

  if (!updated) {
    redirect(
      `/offert/${encodeURIComponent(token)}?result=locked`
    );
  }

  await createAdminNotification({
    type:
      status === "ACCEPTED"
        ? "offer.accepted"
        : "offer.declined",
    title:
      status === "ACCEPTED"
        ? "Offer accepted"
        : "Offer declined",
    message: `${offer.client.name} · ${offer.title}`,
    href: `/hub/offers/${offer.id}`,
    metadata: {
      offerId: offer.id,
      leadId: offer.leadId,
      status,
    },
    dedupeKey: `offer-decision:${offer.id}:${status}`,
    preference: "offers",
  });

  revalidatePath(`/offert/${token}`);
  revalidatePath("/hub/offers");
  revalidatePath(`/hub/offers/${offer.id}`);
  revalidatePath(`/hub/clients/${offer.clientId}`);

  if (offer.leadId) {
    revalidatePath("/hub/leads");
    revalidatePath(`/hub/leads/${offer.leadId}`);
  }

  redirect(
    `/offert/${encodeURIComponent(token)}?result=${
      status === "ACCEPTED"
        ? "accepted"
        : "declined"
    }`
  );
}
