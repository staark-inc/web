import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { verifySmtpConnection } from "@/lib/smtp";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(
      new URL(
        "/hub/login",
        request.url
      ),
      303
    );
  }

  try {
    await verifySmtpConnection();

    return NextResponse.redirect(
      new URL(
        "/hub/settings?smtp=success",
        request.url
      ),
      303
    );
  } catch (error) {
    console.error(
      "SMTP verification failed:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/hub/settings?smtp=error",
        request.url
      ),
      303
    );
  }
}