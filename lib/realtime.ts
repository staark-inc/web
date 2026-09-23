import { prisma } from "@/lib/prisma";
import { getCustomerUnreadCount } from "@/lib/crm-unread";

const REALTIME_URL =
  process.env.REALTIME_URL ??
  "https://socket.staarkinc.com";

const REALTIME_SECRET =
  process.env.REALTIME_PUBLISH_SECRET;

export type HubRealtimeEvent = {
  type: string;
  [key: string]: unknown;
};

type BadgeUpdate = {
  inbox: number;
  leads: number;
};

export async function publishRealtimeEvent(
  event: HubRealtimeEvent
) {
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
        body: JSON.stringify(event),
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

export async function publishBadgeUpdate({
  inbox,
  leads,
}: BadgeUpdate) {
  await publishRealtimeEvent({
    type: "badge:update",
    inbox,
    leads,
  });
}

export async function publishCurrentBadges() {
  const [inbox, leads] = await Promise.all([
    getCustomerUnreadCount(),
    prisma.lead.count({
      where: {
        status: "NEW",
      },
    }),
  ]);

  await publishBadgeUpdate({
    inbox,
    leads,
  });
}
