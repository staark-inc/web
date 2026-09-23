import { getSession } from "@/lib/auth";
import { getNotificationStreamState } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_INTERVAL = 5000;

async function readSignature(userId: string) {
  const [latest, unread, newLeads, notifications] = await Promise.all([
    prisma.message.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.message.count({
      where: { direction: "INBOUND", isRead: false },
    }),
    prisma.lead.count({
      where: { status: "NEW" },
    }),
    getNotificationStreamState(userId),
  ]);

  return {
    signature: [
      latest?.createdAt.getTime() ?? 0,
      unread,
      newLeads,
      notifications.unread,
      notifications.latestId ?? "",
      notifications.latestAt?.getTime() ?? 0,
    ].join(":"),
    unread,
    newLeads,
    notificationUnread: notifications.unread,
    latestNotificationId: notifications.latestId,
  };
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let previous = (await readSignature(session.userId)).signature;

      const send = (event: string, data: unknown) => {
        if (closed) return;

        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            )
          );
        } catch {
          closed = true;
        }
      };

      send("ready", { ok: true });

      const timer = setInterval(async () => {
        if (closed) return;

        try {
          const current = await readSignature(session.userId);

          if (current.signature !== previous) {
            previous = current.signature;

            send("update", {
              unread: current.unread,
              newLeads: current.newLeads,
              notificationUnread: current.notificationUnread,
              latestNotificationId: current.latestNotificationId,
            });
          } else {
            send("ping", { at: Date.now() });
          }
        } catch (error) {
          console.error("[STREAM] Poll failed:", error);
        }
      }, POLL_INTERVAL);

      const close = () => {
        if (closed) return;

        closed = true;
        clearInterval(timer);

        try {
          controller.close();
        } catch {
          // Already closed by the runtime.
        }
      };

      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
