import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { verifySmtpConnection } from "@/lib/smtp";
import { redirectTo } from "@/lib/redirect";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request
) {
  const session = await getSession();

  if (!session) {
    return redirectTo(
      "/hub/login"
    );
  }

  try {
    await verifySmtpConnection();

    return redirectTo("/hub/settings?smtp=success");
  } catch (error) {
    console.error(
      "SMTP verification failed:",
      error
    );

    return redirectTo("/hub/settings?smtp=error");
  }
}