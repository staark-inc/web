import { getGmailClient } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`
    );
  }

  return value;
}

export async function renewGmailWatch() {
  const topicName =
    requiredEnv(
      "GOOGLE_GMAIL_PUBSUB_TOPIC"
    );

  const {
    gmail,
    settings,
  } = await getGmailClient();

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

  /*
   * IMPORTANT:
   *
   * gmailHistoryId is our processing cursor.
   * Do NOT jump it forward every time we
   * renew the Gmail watch.
   *
   * Only initialize it if we don't have
   * one yet.
   */

  await prisma.settings.update({
    where: {
      id: "default",
    },

    data: {
      gmailWatchExpiresAt:
        watchExpiresAt,

      ...(!settings.gmailHistoryId
        ? {
            gmailHistoryId:
              historyId,
          }
        : {}),
    },
  });

  console.log(
    `[GMAIL] Watch renewed. currentHistoryId=${historyId} expiration=${expirationRaw ?? "unknown"}`
  );

  return {
    historyId,
    expiration:
      expirationRaw ?? null,
    watchExpiresAt,
  };
}