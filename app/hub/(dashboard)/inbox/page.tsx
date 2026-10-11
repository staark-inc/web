import { Inbox, MailOpen, PenLine, RefreshCw, Bot, Mail } from "lucide-react";
import InboxWorkspace, { type InboxConversation } from "./InboxWorkspace";
import { WorkspacePage, PageHeader, Metrics, Metric } from "@/components/hub/workspace";

import Link from "next/link";

import { createMailPreview } from "@/lib/mail-content";
import { prisma } from "@/lib/prisma";
import { isAutomatedSender } from "@/lib/crm-mail";
import InboxSearch from "./InboxSearch";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function messageActivityDate(message: { sentAt: Date | null; createdAt: Date }) {
  return message.sentAt ?? message.createdAt;
}

function getInitials(name: string, email: string) {
  const source = name && name !== email ? name : email.split("@")[0] ?? email;

  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "IN";
}

type PageProps = {
  searchParams: Promise<{
    q?: string;
    view?: string;
  }>;
};

type InboxView =
  | "inbox"
  | "needs-reply"
  | "unread"
  | "replied"
  | "other"
  | "all";

function inboxHref(view: InboxView, query: string) {
  const params = new URLSearchParams();
  if (view !== "inbox") params.set("view", view);
  if (query) params.set("q", query);
  const suffix = params.toString();
  return `/hub/inbox${suffix ? `?${suffix}` : ""}`;
}

export default async function HubInboxPage({ searchParams }: PageProps) {
  const { q, view } = await searchParams;
  const query = q?.trim() ?? "";
  const activeView: InboxView =
    view === "needs-reply" ||
    view === "unread" ||
    view === "replied" ||
    view === "other" ||
    view === "all"
      ? view
      : "inbox";

  const threads = await prisma.thread.findMany({
    where: {
      messages: {
        some: {
          direction: "INBOUND",
        },
      },
      ...(query
        ? {
            OR: [
              {
                subject: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                contact: {
                  OR: [
                    {
                      name: {
                        contains: query,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      email: {
                        contains: query,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              },
              {
                messages: {
                  some: {
                    body: {
                      contains: query,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      contact: true,
      messages: {
        /*
         * Inbound Gmail messages use createdAt as their real Gmail date,
         * while outbound messages also get sentAt. Ordering by sentAt with
         * nulls last made an older outbound message look newer than a fresh
         * inbound reply. createdAt is the common activity timestamp here.
         */
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      _count: {
        select: {
          messages: {
            where: {
              direction: "INBOUND",
              isRead: false,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const sortedThreads = [...threads].sort((left, right) => {
    const leftMessage = left.messages[0];
    const rightMessage = right.messages[0];

    const leftTime = leftMessage
      ? messageActivityDate(leftMessage).getTime()
      : left.updatedAt.getTime();
    const rightTime = rightMessage
      ? messageActivityDate(rightMessage).getTime()
      : right.updatedAt.getTime();

    return rightTime - leftTime;
  });

  const threadIds = sortedThreads.map((thread) => thread.id);

  const messageCounts = threadIds.length
    ? await prisma.message.groupBy({
        by: ["threadId"],
        where: {
          threadId: {
            in: threadIds,
          },
        },
        _count: {
          _all: true,
        },
      })
    : [];

  const inboundSenders = threadIds.length
    ? await prisma.message.findMany({
        where: {
          threadId: { in: threadIds },
          direction: "INBOUND",
        },
        select: { threadId: true, fromEmail: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const senderByThread = new Map<string, string>();
  for (const message of inboundSenders) {
    if (message.threadId && !senderByThread.has(message.threadId)) {
      senderByThread.set(message.threadId, message.fromEmail);
    }
  }

  const otherThreads = new Set(
    sortedThreads
      .filter((thread) =>
        isAutomatedSender(
          senderByThread.get(thread.id) ?? "",
          process.env.CRM_BLOCKED_SENDERS
        )
      )
      .map((thread) => thread.id)
  );

  const customerThreads = sortedThreads.filter(
    (thread) => !otherThreads.has(thread.id)
  );

  const unreadMessageCount = customerThreads.reduce(
    (total, thread) => total + thread._count.messages,
    0
  );

  const awaitingReplyCount = customerThreads.filter(
    (thread) => thread.messages[0]?.direction === "INBOUND"
  ).length;

  const repliedCount = customerThreads.filter(
    (thread) => thread.messages[0]?.direction === "OUTBOUND"
  ).length;

  const counts: Record<InboxView, number> = {
    inbox: customerThreads.length,
    "needs-reply": awaitingReplyCount,
    unread: customerThreads.filter((thread) => thread._count.messages > 0).length,
    replied: repliedCount,
    other: otherThreads.size,
    all: sortedThreads.length,
  };

  const visibleThreads = sortedThreads.filter((thread) => {
    if (activeView === "all") return true;
    if (activeView === "other") return otherThreads.has(thread.id);
    if (otherThreads.has(thread.id)) return false;

    if (activeView === "needs-reply") {
      return thread.messages[0]?.direction === "INBOUND";
    }

    if (activeView === "unread") {
      return thread._count.messages > 0;
    }

    if (activeView === "replied") {
      return thread.messages[0]?.direction === "OUTBOUND";
    }

    return true;
  });

  const messageCountMap = new Map<string, number>();
  for (const item of messageCounts) {
    if (item.threadId) {
      messageCountMap.set(item.threadId, item._count._all);
    }
  }


  const returnTo = inboxHref(activeView, query);
  const conversations: InboxConversation[] = visibleThreads.flatMap((thread) => {
    const latestMessage = thread.messages[0];
    if (!latestMessage) return [];
    const unread = thread._count.messages;
    const email = thread.contact?.email ??
      (latestMessage.direction === "INBOUND" ? latestMessage.fromEmail : latestMessage.toEmail);
    const name = thread.contact?.name ||
      (latestMessage.direction === "INBOUND" ? latestMessage.fromName : null) || email;
    const activity = messageActivityDate(latestMessage);
    return [{
      id: thread.id,
      initials: getInitials(name, email),
      name,
      email,
      subject: thread.subject,
      preview: (latestMessage.direction === "OUTBOUND" ? "You: " : "") + createMailPreview(latestMessage.body),
      date: formatDate(activity),
      dateIso: activity.toISOString(),
      messageCount: messageCountMap.get(thread.id) ?? 1,
      unread,
      isOther: otherThreads.has(thread.id),
      needsReply: latestMessage.direction === "INBOUND",
      href: "/hub/thread/" + thread.id + "?returnTo=" + encodeURIComponent(returnTo),
    }];
  });


  return (
    <WorkspacePage>
      <div className="sw-inbox-page">
        <PageHeader eyebrow="COMMUNICATION / MAIL" title="Inbox"
          description="Review customer conversations without leaving your workspace."
          action={
            <div className="sw-overview-actions">
              <Link href={returnTo} className="sw-overview-secondary"><RefreshCw size={15}/> Refresh</Link>
              <Link href="/hub/compose" className="sw-overview-primary"><PenLine size={15}/> Compose</Link>
            </div>
          }
        />
        <Metrics label="Inbox overview">
          <Metric label="Conversations" value={counts.inbox} description="Customer threads" icon={<Inbox size={18}/>} />
          <Metric label="Unread messages" value={unreadMessageCount} description="Needs review" icon={<MailOpen size={18}/>} />
          <Metric label="Awaiting reply" value={awaitingReplyCount} description="Latest message inbound" icon={<Mail size={18}/>} />
          <Metric label="Other mail" value={counts.other} description="Automated / filtered" icon={<Bot size={18}/>} />
        </Metrics>
        <div className="sw-inbox-toolbar">
          <InboxSearch initialQuery={query} view={activeView}/>
          <span className="sw-inbox-count">{conversations.length} conversations</span>
        </div>
        <nav className="sw-inbox-tabs" aria-label="Inbox views">
          {([
            ["inbox", "Inbox"],
            ["needs-reply", "Needs reply"],
            ["unread", "Unread"],
            ["replied", "Replied"],
            ["other", "Other"],
            ["all", "All mail"],
          ] as const).map(([key, label]) => (
            <Link key={key} href={inboxHref(key, query)}
              className={"sw-inbox-tab " + (activeView === key ? "is-active" : "")}
              aria-current={activeView === key ? "page" : undefined}>
              {label}<span>{counts[key]}</span>
            </Link>
          ))}
        </nav>
        <InboxWorkspace conversations={conversations} selectedView={activeView} key={activeView + ":" + query}/>
      </div>
    </WorkspacePage>
  );
}
