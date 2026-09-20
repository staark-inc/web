import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getGmailClient } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";

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

export async function POST() {
  const session = await getSession();

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
    const topicName =
      requiredEnv(
        "GOOGLE_GMAIL_PUBSUB_TOPIC"
      );

    const {
      gmail,
    } =
      await getGmailClient();

    const response =
      await gmail.users.watch({
        userId: "me",

        requestBody: {
          topicName,

          labelIds: [
            "INBOX",
          ],

          labelFilterBehavior:
            "include",
        },
      });

    const historyId =
      response.data.historyId;

    const expirationRaw =
      response.data.expiration;

    if (!historyId) {
      throw new Error(
        "Gmail watch did not return historyId."
      );
    }

    const expirationNumber =
      expirationRaw
        ? Number(expirationRaw)
        : NaN;

    const watchExpiresAt =
      Number.isFinite(
        expirationNumber
      )
        ? new Date(
            expirationNumber
          )
        : null;

    await prisma.settings.update({
      where: {
        id: "default",
      },

      data: {
        gmailHistoryId:
          historyId,

        gmailWatchExpiresAt:
          watchExpiresAt,
      },
    });

    console.log(
      `[GMAIL] Watch started. historyId=${historyId} expiration=${expirationRaw ?? "unknown"}`
    );

    return NextResponse.json({
      ok: true,
      historyId,
      expiration:
        expirationRaw ?? null,
      watchExpiresAt:
        watchExpiresAt
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