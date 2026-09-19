import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const allowedStatuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "WON",
  "LOST",
] as const;

type LeadStatus =
  (typeof allowedStatuses)[number];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(
      new URL("/hub/login", request.url),
      303
    );
  }

  const { id } = await params;

  try {
    const formData = await request.formData();

    const status = String(
      formData.get("status") ?? ""
    ).toUpperCase();

    if (
      !allowedStatuses.includes(
        status as LeadStatus
      )
    ) {
      return NextResponse.redirect(
        new URL(
          `/hub/leads/${id}?error=invalid-status`,
          request.url
        ),
        303
      );
    }

    await prisma.lead.update({
      where: {
        id,
      },
      data: {
        status: status as LeadStatus,
      },
    });

    return NextResponse.redirect(
      new URL(
        `/hub/leads/${id}?updated=1`,
        request.url
      ),
      303
    );
  } catch (error) {
    console.error(
      "Lead status update failed:",
      error
    );

    return NextResponse.redirect(
      new URL(
        `/hub/leads/${id}?error=update-failed`,
        request.url
      ),
      303
    );
  }
}