import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const offer = await prisma.offer.findUnique({
    where: { id },
    select: {
      id: true,
      clientId: true,
      status: true,
      shareToken: true,
      scope: true,
      oneTimePriceOre: true,
      monthlyPriceOre: true,
    },
  });

  if (!offer) {
    return NextResponse.json(
      { error: "Offer not found." },
      { status: 404 }
    );
  }

  if (
    offer.status === "SHARED" ||
    offer.status === "VIEWED"
  ) {
    return NextResponse.json({
      ok: true,
      alreadyShared: true,
    });
  }

  if (offer.status !== "DRAFT") {
    return NextResponse.json(
      {
        error:
          "This offer can no longer be marked as shared.",
      },
      { status: 409 }
    );
  }

  if (
    !offer.scope ||
    (
      offer.oneTimePriceOre === null &&
      offer.monthlyPriceOre === null
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Add the scope and at least one price before sharing the offer.",
      },
      { status: 400 }
    );
  }

  const updated = await prisma.offer.updateMany({
    where: {
      id: offer.id,
      status: "DRAFT",
    },
    data: {
      status: "SHARED",
      shareToken:
        offer.shareToken ?? randomUUID(),
      sharedAt: new Date(),
      viewedAt: null,
      decidedAt: null,
    },
  });

  if (updated.count !== 1) {
    return NextResponse.json(
      {
        error:
          "The offer changed while the email was being sent.",
      },
      { status: 409 }
    );
  }

  revalidatePath("/hub/offers");
  revalidatePath(`/hub/offers/${offer.id}`);
  revalidatePath(`/hub/clients/${offer.clientId}`);

  return NextResponse.json({
    ok: true,
  });
}
