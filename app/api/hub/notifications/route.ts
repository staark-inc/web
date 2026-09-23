import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  countUnreadNotifications,
  createNotificationForUser,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const [notifications, unread] = await Promise.all([
    listNotifications(session.userId, 20),
    countUnreadNotifications(session.userId),
  ]);

  return NextResponse.json({
    notifications,
    unread,
  });
}

export async function POST() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  await createNotificationForUser(session.userId, {
    type: "system.test",
    title: "Realtime test",
    message: "If you can see this without refreshing, Hub notifications are live.",
    href: "/hub/profile/notifications",
    dedupeKey: `test:${Date.now()}`,
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { action?: unknown; id?: unknown }
    | null;

  if (body?.action === "read-all") {
    await markAllNotificationsRead(session.userId);

    return NextResponse.json({ ok: true });
  }

  if (
    body?.action === "read" &&
    typeof body.id === "string" &&
    body.id
  ) {
    await markNotificationRead(session.userId, body.id);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "Invalid action" },
    { status: 400 }
  );
}
