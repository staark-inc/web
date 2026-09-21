import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_INTERVAL = 5000;

/*
 * The signature only needs to change when something
 * the Hub displays changes, so it is built from the
 * newest message timestamp plus the unread counters.
 */
async function readSignature() {
  const [latest, unread, newLeads] = await Promise.all([
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
  ]);

  return {
    signature: `${latest?.createdAt.getTime() ?? 0}:${unread}:${newLeads}`,
    unread,
    newLeads,
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
      let previous = (await readSignature()).signature;

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
          const current = await readSignature();

          if (current.signature !== previous) {
            previous = current.signature;

            send("update", {
              unread: current.unread,
              newLeads: current.newLeads,
            });
          } else {
            /* Keeps proxies from dropping an idle connection. */
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
          /* Already closed by the runtime. */
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
