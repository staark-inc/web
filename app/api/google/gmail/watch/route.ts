import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  renewGmailWatch,
} from "@/lib/gmail-watch";

export const runtime = "nodejs";

export async function POST() {
  const session =
    await getSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
      }
    );
  }

  try {
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
      "[GMAIL] Watch failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not start Gmail watch.",
      },
      {
        status: 500,
      }
    );
  }
}