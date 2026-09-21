"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  const offer = await prisma.offer.findUnique({
    where: {
      shareToken: token,
    },
    select: {
      id: true,
      clientId: true,
      status: true,
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

  const updated = await prisma.offer.updateMany({
    where: {
      id: offer.id,
      status: offer.status,
    },
    data: {
      status,
      decidedAt: new Date(),
    },
  });

  if (updated.count !== 1) {
    redirect(
      `/offert/${encodeURIComponent(token)}?result=locked`
    );
  }

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
