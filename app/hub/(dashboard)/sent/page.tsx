import { WorkspaceTabs } from "@/components/hub/WorkspaceTabs";
import Link from "next/link";
import { Clock3, MailCheck, MessageSquare, Search, Send } from "lucide-react";
import InboxWorkspace, { type InboxConversation } from "../inbox/InboxWorkspace";
import { WorkspacePage, PageHeader, Metrics, Metric } from "@/components/hub/workspace";

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

  const conversations: InboxConversation[] = filteredRows.map((row) => ({
    id: row.id,
    initials: row.contactName.trim().slice(0, 2).toUpperCase() || "SE",
    name: row.contactName,
    email: row.contactEmail,
    subject: row.subject,
    preview: (row.latestDirection === "OUTBOUND" ? "You: " : "Reply: ") + createMailPreview(row.preview),
    date: formatDate(row.latestAt),
    dateIso: row.latestAt.toISOString(),
    messageCount: row.messageCount,
    unread: 0,
    isOther: false,
    needsReply: row.awaitingReply,
    href: "/hub/thread/" + row.id + "?returnTo=" + encodeURIComponent(makeStatusHref(status)),
  }));
  return (
    <WorkspacePage>
      <div className="sw-inbox-page sw-sent-page">
        <PageHeader eyebrow="COMMUNICATION / OUTBOX" title="Sent"
          description="Follow outgoing conversations and customer replies."
          action={<Link href="/hub/compose" className="sw-overview-primary"><Send size={16}/> New message</Link>}
        />
        <Metrics label="Sent overview">
          <Metric label="Sent conversations" value={rows.length} description="Threads containing outgoing mail" icon={<MessageSquare size={18}/>} />
          <Metric label="Awaiting reply" value={awaitingCount} description="Your message is the latest" icon={<Clock3 size={18}/>} />
          <Metric label="Replied" value={repliedCount} description="Customer replied last" icon={<MailCheck size={18}/>} />
        </Metrics>
        <div className="sw-inbox-toolbar">
          <form action="/hub/sent" className="sw-sent-search" role="search">
            <Search size={17} aria-hidden="true"/>
            <input type="search" name="q" aria-label="Search sent conversations"
              defaultValue={params.q ?? ""} placeholder="Search recipient, subject or message..." />
            {status !== "all" && <input type="hidden" name="status" value={status}/>}
            <button type="submit">Search</button>
          </form>
          <span className="sw-inbox-count">{filteredRows.length} conversations</span>
        </div>
        <WorkspaceTabs label="Sent conversation status" activeKey={status}
          tabs={([
            ["all", "All"], ["awaiting", "Awaiting reply"], ["replied", "Replied"],
          ] as const).map(([key, label]) => ({
            key, label, href: makeStatusHref(key),
            count: key === "all" ? rows.length : key === "awaiting" ? awaitingCount : repliedCount,
          }))}
          trailing={(query || status !== "all") ? <Link href="/hub/sent" className="sw-filter-clear">Clear filters</Link> : null}/>

        <InboxWorkspace mode="sent" selectedView={status} conversations={conversations}
          key={status + ":" + query}/>
      </div>
    </WorkspacePage>
  );
}
