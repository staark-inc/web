import { prisma } from "@/lib/prisma";

const REALTIME_URL =
  process.env.REALTIME_URL ??
  "https://socket.staarkinc.com";

const REALTIME_SECRET =
  process.env.REALTIME_PUBLISH_SECRET;

type BadgeUpdate = {
  inbox: number;
  leads: number;
};

export async function publishBadgeUpdate({
  inbox,
  leads,
}: BadgeUpdate) {
  if (!REALTIME_SECRET) {
    console.warn(
      "[Realtime] Missing REALTIME_PUBLISH_SECRET"
    );

    return;
  }

  try {
    const response = await fetch(
      `${REALTIME_URL}/publish`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization:
            `Bearer ${REALTIME_SECRET}`,
        },

        body: JSON.stringify({
          type: "badge:update",
          inbox,
          leads,
        }),

        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "[Realtime] Publish failed:",
        response.status
      );
    }
  } catch (error) {
    console.error(
      "[Realtime] Publish error:",
      error
    );
  }
}

export async function publishCurrentBadges() {
  if (!REALTIME_SECRET) {
    console.warn(
      "[Realtime] Missing REALTIME_PUBLISH_SECRET"
    );

    return;
  }

  const [
    inbox,
    leads,
  ] = await Promise.all([
    prisma.message.count({
      where: {
        direction: "INBOUND",
        isRead: false,
      },
    }),

    prisma.lead.count({
      where: {
        status: "NEW",
      },
    }),
  ]);

  try {
    const response = await fetch(
      `${REALTIME_URL}/publish`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${REALTIME_SECRET}`,
        },

        body: JSON.stringify({
          type: "badge:update",
          inbox,
          leads,
        }),

        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "[Realtime] Publish failed:",
        response.status
      );
    }
  } catch (error) {
    console.error(
      "[Realtime] Publish error:",
      error
    );
  }
}