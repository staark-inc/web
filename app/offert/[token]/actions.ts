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

  const updated = await prisma.offer.updateMany({
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

  if (updated.count !== 1) {
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
      status,
    },
    dedupeKey: `offer-decision:${offer.id}:${status}`,
  });

  revalidatePath(`/offert/${token}`);
  revalidatePath("/hub/offers");
  revalidatePath(`/hub/offers/${offer.id}`);
  revalidatePath(`/hub/clients/${offer.clientId}`);

  redirect(
    `/offert/${encodeURIComponent(token)}?result=${
      status === "ACCEPTED"
        ? "accepted"
        : "declined"
    }`
  );
}
