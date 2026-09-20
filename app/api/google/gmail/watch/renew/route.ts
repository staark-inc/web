import { NextResponse } from "next/server";

import {
  renewGmailWatch,
} from "@/lib/gmail-watch";

export const runtime = "nodejs";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`
    );
  }

  return value;
}

export async function POST(
  request: Request
) {
  try {
    const expectedSecret =
      requiredEnv(
        "GOOGLE_GMAIL_WATCH_CRON_SECRET"
      );

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      authorization !==
      `Bearer ${expectedSecret}`
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const result =
      await renewGmailWatch();

    return NextResponse.json({
      ok: true,

      historyId:
        result.historyId,

      expiration:
        result.expiration,

      watchExpiresAt:
        result.watchExpiresAt
          ?.toISOString() ??
        null,
    });
  } catch (error) {
    console.error(
      "[GMAIL] Automatic watch renewal failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not renew Gmail watch.",
      },
      {
        status: 500,
      }
    );
  }
}