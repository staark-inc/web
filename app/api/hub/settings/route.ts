import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function redirectToSettings(
  request: NextRequest,
  params: string
) {
  return NextResponse.redirect(
    new URL(
      `/hub/settings?${params}`,
      request.url
    ),
    303
  );
}

export async function POST(
  request: NextRequest
) {
  const session = await getSession();

  if (!session) {
    return redirectToSettings(
      request,
      "error=not_logged_in"
    );
  }

  const formData =
    await request.formData();

  const senderName = String(
    formData.get("senderName") ?? ""
  ).trim();

  const senderEmail = String(
    formData.get("senderEmail") ?? ""
  )
    .trim()
    .toLowerCase();

  const signature = String(
    formData.get("signature") ?? ""
  ).trim();

  const defaultTemplate = String(
    formData.get("defaultTemplate") ??
      "staark-standard"
  );

  if (
    senderName.length < 2 ||
    senderName.length > 80
  ) {
    return redirectToSettings(
      request,
      "error=invalid_name"
    );
  }

  if (
    !senderEmail ||
    senderEmail.length > 160 ||
    !senderEmail.includes("@")
  ) {
    return redirectToSettings(
      request,
      "error=invalid_email"
    );
  }

  const allowedTemplates = [
    "staark-standard",
  ];

  const safeTemplate =
    allowedTemplates.includes(defaultTemplate)
      ? defaultTemplate
      : "staark-standard";

  try {
    await prisma.settings.upsert({
      where: {
        id: "default",
      },

      create: {
        id: "default",
        senderName,
        senderEmail,
        signature:
          signature || null,
        defaultTemplate:
          safeTemplate,
      },

      update: {
        senderName,
        senderEmail,
        signature:
          signature || null,
        defaultTemplate:
          safeTemplate,
      },
    });

    return redirectToSettings(
      request,
      "updated=1"
    );
  } catch (error) {
    console.error(
      "Settings update failed:",
      error
    );

    return redirectToSettings(
      request,
      "error=unknown"
    );
  }
}