import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirectTo } from "@/lib/redirect";
import { publishCurrentBadges } from "@/lib/realtime";

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
  context: RouteContext
) {
  const session = await getSession();

  if (!session) {
    return redirectTo("/hub/login");
  }

  const { id } = await context.params;

  try {
    const formData =
      await request.formData();

    const status = String(
      formData.get("status") ?? ""
    ).toUpperCase();

    if (
      !allowedStatuses.includes(
        status as LeadStatus
      )
    ) {
      return redirectTo(`/hub/leads/${id}?error=invalid-status`);
    }

    await prisma.lead.update({
      where: {
        id,
      },

      data: {
        status: status as LeadStatus,
      },
    });

    await publishCurrentBadges();

    return redirectTo(`/hub/leads/${id}?updated=1`);
  } catch (error) {
    console.error(
      "Lead status update failed:",
      error
    );

    return redirectTo(`/hub/leads/${id}?error=update-failed`);
  }
}