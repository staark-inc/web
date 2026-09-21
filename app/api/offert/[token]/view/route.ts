import { NextResponse } from "next/server";

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
      status: true,
    },
  });

  if (!offer) {
    return NextResponse.json(
      { ok: false },
      { status: 404 }
    );
  }

  if (offer.status === "SHARED") {
    await prisma.offer.updateMany({
      where: {
        id: offer.id,
        status: "SHARED",
      },
      data: {
        status: "VIEWED",
        viewedAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    ok: true,
  });
}
