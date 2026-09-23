import { NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectTo } from "@/lib/redirect";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function redirectToSettings(request: Request, params: string) {
  return redirectTo(`/hub/settings?tab=email&${params}`, request);
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return redirectToSettings(request, "error=not_logged_in");
  }

  const formData = await request.formData();

  const senderName = String(formData.get("senderName") ?? "").trim();
  const senderEmail = String(formData.get("senderEmail") ?? "")
    .trim()
    .toLowerCase();
  const replyToEmail = String(formData.get("replyToEmail") ?? "")
    .trim()
    .toLowerCase();
  const signature = String(formData.get("signature") ?? "").trim();

  if (senderName.length < 2 || senderName.length > 80) {
    return redirectToSettings(request, "error=invalid_name");
  }

  if (!senderEmail || senderEmail.length > 160 || !emailPattern.test(senderEmail)) {
    return redirectToSettings(request, "error=invalid_email");
  }

  if (replyToEmail && (replyToEmail.length > 160 || !emailPattern.test(replyToEmail))) {
    return redirectToSettings(request, "error=invalid_reply_email");
  }

  try {
    await prisma.settings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        senderName,
        senderEmail,
        replyToEmail: replyToEmail || null,
        signature: signature || null,
      },
      update: {
        senderName,
        senderEmail,
        replyToEmail: replyToEmail || null,
        signature: signature || null,
      },
    });

    return redirectToSettings(request, "updated=1");
  } catch (error) {
    console.error("Settings update failed:", error);
    return redirectToSettings(request, "error=unknown");
  }
}
