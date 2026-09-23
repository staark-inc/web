import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { publishRealtimeEvent } from "@/lib/realtime";

export type NotificationPreferenceKey =
  | "inbox"
  | "leads"
  | "offers"
  | "support"
  | "billing";

export type NotificationPreferences = Record<
  NotificationPreferenceKey,
  boolean
>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  inbox: true,
  leads: true,
  offers: true,
  support: true,
  billing: true,
};

export type HubNotification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  href: string | null;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
};

type CreateAdminNotificationInput = {
  type: string;
  title: string;
  message?: string | null;
  href?: string | null;
  metadata?: Record<string, unknown> | null;
  dedupeKey?: string | null;
  preference?: NotificationPreferenceKey;
};

type UserRow = {
  id: string;
  notificationPreferences: unknown;
};

type CountRow = {
  count: bigint;
};

type LatestRow = {
  id: string;
  createdAt: Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseNotificationPreferences(
  value: unknown
): NotificationPreferences {
  if (!isRecord(value)) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  return {
    inbox:
      typeof value.inbox === "boolean"
        ? value.inbox
        : DEFAULT_NOTIFICATION_PREFERENCES.inbox,
    leads:
      typeof value.leads === "boolean"
        ? value.leads
        : DEFAULT_NOTIFICATION_PREFERENCES.leads,
    offers:
      typeof value.offers === "boolean"
        ? value.offers
        : DEFAULT_NOTIFICATION_PREFERENCES.offers,
    support:
      typeof value.support === "boolean"
        ? value.support
        : DEFAULT_NOTIFICATION_PREFERENCES.support,
    billing:
      typeof value.billing === "boolean"
        ? value.billing
        : DEFAULT_NOTIFICATION_PREFERENCES.billing,
  };
}

export async function createAdminNotification(
  input: CreateAdminNotificationInput
) {
  const admins = await prisma.$queryRaw<UserRow[]>`
    SELECT "id", "notificationPreferences"
    FROM "User"
    WHERE "role" = 'ADMIN'
  `;

  const recipients = admins.filter((admin) => {
    if (!input.preference) return true;

    const preferences = parseNotificationPreferences(
      admin.notificationPreferences
    );

    return preferences[input.preference];
  });

  if (recipients.length === 0) {
    return;
  }

  const metadata = input.metadata
    ? JSON.stringify(input.metadata)
    : null;

  await prisma.$transaction(
    recipients.map((admin) =>
      prisma.$executeRaw`
        INSERT INTO "Notification" (
          "id",
          "userId",
          "type",
          "title",
          "message",
          "href",
          "metadata",
          "dedupeKey",
          "createdAt"
        )
        VALUES (
          ${randomUUID()},
          ${admin.id},
          ${input.type},
          ${input.title},
          ${input.message ?? null},
          ${input.href ?? null},
          ${metadata}::jsonb,
          ${input.dedupeKey ?? null},
          NOW()
        )
        ON CONFLICT ("userId", "dedupeKey")
        DO NOTHING
      `
    )
  );

  await publishRealtimeEvent({
    type: "notification:update",
  });
}

export async function listNotifications(
  userId: string,
  limit = 12
) {
  const safeLimit = Math.max(1, Math.min(limit, 50));

  return prisma.$queryRaw<HubNotification[]>`
    SELECT
      "id",
      "type",
      "title",
      "message",
      "href",
      "metadata",
      "readAt",
      "createdAt"
    FROM "Notification"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT ${safeLimit}
  `;
}

export async function countUnreadNotifications(
  userId: string
) {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::bigint AS "count"
    FROM "Notification"
    WHERE "userId" = ${userId}
      AND "readAt" IS NULL
  `;

  return Number(rows[0]?.count ?? 0n);
}

export async function getNotificationStreamState(
  userId: string
) {
  const [unread, latest] = await Promise.all([
    countUnreadNotifications(userId),
    prisma.$queryRaw<LatestRow[]>`
      SELECT "id", "createdAt"
      FROM "Notification"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `,
  ]);

  return {
    unread,
    latestId: latest[0]?.id ?? null,
    latestAt: latest[0]?.createdAt ?? null,
  };
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
) {
  await prisma.$executeRaw`
    UPDATE "Notification"
    SET "readAt" = COALESCE("readAt", NOW())
    WHERE "id" = ${notificationId}
      AND "userId" = ${userId}
  `;
}

export async function markAllNotificationsRead(
  userId: string
) {
  await prisma.$executeRaw`
    UPDATE "Notification"
    SET "readAt" = NOW()
    WHERE "userId" = ${userId}
      AND "readAt" IS NULL
  `;
}
