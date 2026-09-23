import { NextResponse } from "next/server";

import { createAdminNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ token: string }>;
  }
) {
  const { token } = await params;

  const offer = await prisma.offer.findUnique({
    where: {
      shareToken: token,
    },
    select: {
      id: true,
      title: true,
      status: true,
      client: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!offer) {
    return NextResponse.json(
      { ok: false },
      { status: 404 }
    );
  }

  if (offer.status === "SHARED") {
    const updated = await prisma.offer.updateMany({
      where: {
        id: offer.id,
        status: "SHARED",
      },
      data: {
        status: "VIEWED",
        viewedAt: new Date(),
      },
    });

    if (updated.count === 1) {
      await createAdminNotification({
        type: "offer.viewed",
        title: "Offer viewed",
        message: `${offer.client.name} · ${offer.title}`,
        href: `/hub/offers/${offer.id}`,
        metadata: {
          offerId: offer.id,
        },
        dedupeKey: `offer-viewed:${offer.id}`,
      });
    }
  }

  return NextResponse.json({
    ok: true,
  });
}
