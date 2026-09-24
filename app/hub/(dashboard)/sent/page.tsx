import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  MailCheck,
  MessageSquare,
  Search,
  Send,
} from "lucide-react";

import { createMailPreview } from "@/lib/mail-content";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SentSearchParams = Promise<{
  q?: string;
  status?: string;
}>;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizedStatus(value: string | undefined) {
  return value === "awaiting" || value === "replied" ? value : "all";
}

export default async function HubSentPage({
  searchParams,
}: {
  searchParams: SentSearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const status = normalizedStatus(params.status);

  const threads = await prisma.thread.findMany({
    where: {
      messages: {
        some: { direction: "OUTBOUND" },
      },
    },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows = threads.flatMap((thread) => {
    const latest = thread.messages[0];
    if (!latest) return [];

    const contactEmail = thread.contact?.email ?? latest.toEmail;
    const contactName = thread.contact?.name || contactEmail;
    const awaitingReply = latest.direction === "OUTBOUND";

    return [
      {
        id: thread.id,
        subject: thread.subject,
        contactEmail,
        contactName,
        company: thread.contact?.company ?? "",
        preview: latest.body,
        latestDirection: latest.direction,
        latestAt: latest.sentAt ?? latest.createdAt,
        messageCount: thread._count.messages,
        awaitingReply,
      },
    ];
  });

  const awaitingCount = rows.filter((row) => row.awaitingReply).length;
  const repliedCount = rows.length - awaitingCount;

  const filteredRows = rows.filter((row) => {
    if (status === "awaiting" && !row.awaitingReply) return false;
    if (status === "replied" && row.awaitingReply) return false;

    if (!query) return true;

    return [row.contactName, row.contactEmail, row.company, row.subject, row.preview]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const makeStatusHref = (nextStatus: string) => {
    const search = new URLSearchParams();
    if (query) search.set("q", params.q?.trim() ?? "");
    if (nextStatus !== "all") search.set("status", nextStatus);
    const suffix = search.toString();
    return suffix ? `/hub/sent?${suffix}` : "/hub/sent";
  };

  return (
    <div className="hub-page hub-mail-v2-page hub-sent-v2-page">
      <header className="hub-page-header hub-mail-v2-header">
        <div>
          <span className="hub-eyebrow">MAIL WORKSPACE</span>
          <h1>Sent</h1>
          <p>Track outgoing conversations and see who still owes you a reply.</p>
        </div>

        <Link href="/hub/compose" className="hub-header-action">
          <Send size={16} />
          New message
        </Link>
      </header>

      <section className="hub-sent-v2-stats">
        <div>
          <span><MessageSquare size={16} /> Sent conversations</span>
          <strong>{rows.length}</strong>
          <small>Threads with at least one outbound message</small>
        </div>
        <div>
          <span><Clock3 size={16} /> Awaiting reply</span>
          <strong>{awaitingCount}</strong>
          <small>Last message was sent by you</small>
        </div>
        <div>
          <span><MailCheck size={16} /> Replied</span>
          <strong>{repliedCount}</strong>
          <small>Customer sent the latest message</small>
        </div>
      </section>

      <section className="hub-sent-v2-toolbar">
        <form action="/hub/sent" className="hub-sent-v2-search">
          <Search size={16} />
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search recipient, subject or message..."
          />
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <button type="submit">Search</button>
        </form>

        <nav className="hub-sent-v2-filters" aria-label="Sent conversation status">
          {[
            ["all", "All"],
            ["awaiting", "Awaiting reply"],
            ["replied", "Replied"],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={makeStatusHref(key)}
              className={status === key ? "is-active" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
      </section>

      <section className="hub-sent-v2-list">
        <div className="hub-sent-v2-list-head">
          <div>
            <span className="hub-mail-v2-kicker">CONVERSATIONS</span>
            <strong>
              {filteredRows.length} {filteredRows.length === 1 ? "result" : "results"}
            </strong>
          </div>

          {(query || status !== "all") && (
            <Link href="/hub/sent" className="hub-mail-v2-ghost">
              Clear filters
            </Link>
          )}
        </div>

        {filteredRows.length === 0 ? (
          <div className="hub-mail-v2-empty">
            <Send size={24} />
            <h2>No sent conversations found</h2>
            <p>Try another search or start a new message from the Hub.</p>
            <Link href="/hub/compose" className="hub-header-action">
              New message
            </Link>
          </div>
        ) : (
          <div className="hub-sent-v2-rows">
            {filteredRows.map((row) => (
              <Link
                key={row.id}
                href={`/hub/thread/${row.id}`}
                className="hub-sent-v2-row"
              >
                <div className="hub-sent-v2-avatar">
                  {row.contactName.charAt(0).toUpperCase()}
                </div>

                <div className="hub-sent-v2-main">
                  <div className="hub-sent-v2-topline">
                    <strong>{row.contactName}</strong>
                    {row.company && <span>{row.company}</span>}
                    <time>{formatDate(row.latestAt)}</time>
                  </div>

                  <h2>{row.subject}</h2>

                  <p>
                    <b>{row.latestDirection === "OUTBOUND" ? "You:" : "Reply:"}</b>{" "}
                    {createMailPreview(row.preview)}
                  </p>

                  <div className="hub-sent-v2-meta">
                    <span>{row.contactEmail}</span>
                    <span>·</span>
                    <span>
                      {row.messageCount} {row.messageCount === 1 ? "message" : "messages"}
                    </span>
                  </div>
                </div>

                <div className="hub-sent-v2-status-col">
                  <span className={row.awaitingReply ? "is-awaiting" : "is-replied"}>
                    {row.awaitingReply ? <Clock3 size={13} /> : <MailCheck size={13} />}
                    {row.awaitingReply ? "Awaiting reply" : "Replied"}
                  </span>
                  <ArrowUpRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
