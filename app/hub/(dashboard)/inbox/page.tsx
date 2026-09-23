import {
  ArrowRight,
  Bot,
  Inbox,
  Mail,
  MailCheck,
  MailOpen,
  PenLine,
  RefreshCw,
  Search,
} from "lucide-react";

import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { isAutomatedSender } from "@/lib/crm-mail";
import InboxSearch from "./InboxSearch";
import "../../inbox-workspace-v2.css";
import "../../inbox-workspace-polish.css";

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

function createPreview(value: string, maxLength = 150) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
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

type InboxView = "inbox" | "unread" | "other" | "all";

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
    view === "unread" || view === "other" || view === "all" ? view : "inbox";

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
        orderBy: [
          {
            sentAt: {
              sort: "desc",
              nulls: "last",
            },
          },
          {
            createdAt: "desc",
          },
        ],
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

  /*
   * Thread.updatedAt only changes when the Thread itself is written.
   * Creating a related Message does not reliably make it the newest thread.
   * Sort from the latest actual email timestamp instead.
   */
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

  const counts: Record<InboxView, number> = {
    inbox: customerThreads.length,
    unread: customerThreads.filter((thread) => thread._count.messages > 0).length,
    other: otherThreads.size,
    all: sortedThreads.length,
  };

  const visibleThreads = sortedThreads.filter((thread) => {
    if (activeView === "all") return true;
    if (activeView === "other") return otherThreads.has(thread.id);

    return (
      !otherThreads.has(thread.id) &&
      (activeView !== "unread" || thread._count.messages > 0)
    );
  });

  const messageCountMap = new Map<string, number>();
  for (const item of messageCounts) {
    if (item.threadId) {
      messageCountMap.set(item.threadId, item._count._all);
    }
  }

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

  return (
    <div className="hub-page hub-inbox-v2-page">
      <header className="hub-inbox-v2-head">
        <div>
          <span className="hub-eyebrow">MAIL / CONVERSATIONS</span>
          <h1>Inbox</h1>
          <p>Customer conversations, replies and incoming enquiries in one place.</p>
        </div>

        <div className="hub-inbox-v2-actions">
          <Link
            href={inboxHref(activeView, query)}
            className="hub-secondary-button"
            aria-label="Refresh inbox"
          >
            <RefreshCw size={14} />
            Refresh
          </Link>

          <Link href="/hub/compose" className="hub-inbox-v2-compose">
            <PenLine size={14} />
            New message
          </Link>
        </div>
      </header>

      <section className="hub-inbox-v2-overview" aria-label="Inbox overview">
        <div className="hub-inbox-v2-stat">
          <span className="hub-inbox-v2-stat-icon">
            <Inbox size={16} />
          </span>
          <div>
            <small>Conversations</small>
            <strong>{counts.inbox}</strong>
            <span>Customer threads</span>
          </div>
        </div>

        <div className="hub-inbox-v2-stat">
          <span className="hub-inbox-v2-stat-icon hub-inbox-v2-stat-icon-unread">
            <MailOpen size={16} />
          </span>
          <div>
            <small>Unread</small>
            <strong>{unreadMessageCount}</strong>
            <span>Messages needing review</span>
          </div>
        </div>

        <div className="hub-inbox-v2-stat">
          <span className="hub-inbox-v2-stat-icon hub-inbox-v2-stat-icon-reply">
            <Mail size={16} />
          </span>
          <div>
            <small>Awaiting reply</small>
            <strong>{awaitingReplyCount}</strong>
            <span>Latest message is inbound</span>
          </div>
        </div>

        <div className="hub-inbox-v2-stat">
          <span className="hub-inbox-v2-stat-icon hub-inbox-v2-stat-icon-other">
            <Bot size={16} />
          </span>
          <div>
            <small>Other mail</small>
            <strong>{counts.other}</strong>
            <span>Automated or filtered</span>
          </div>
        </div>
      </section>

      <div className="hub-inbox-v2-toolbar">
        <InboxSearch initialQuery={query} view={activeView} />

        <div className="hub-inbox-v2-total">
          <MailCheck size={15} />
          <span>
            {visibleThreads.length} {visibleThreads.length === 1 ? "conversation" : "conversations"}
            {query && " found"}
          </span>
        </div>
      </div>

      <nav className="hub-inbox-v2-tabs" aria-label="Inbox views">
        {([
          ["inbox", "Inbox"],
          ["unread", "Unread"],
          ["other", "Other"],
          ["all", "All mail"],
        ] as const).map(([key, label]) => (
          <Link
            key={key}
            href={inboxHref(key, query)}
            className={`hub-inbox-v2-tab ${
              activeView === key ? "hub-inbox-v2-tab-active" : ""
            }`}
            aria-current={activeView === key ? "page" : undefined}
          >
            {label}
            <span>{counts[key]}</span>
          </Link>
        ))}
      </nav>

      {visibleThreads.length === 0 ? (
        <section className="hub-inbox-v2-empty">
          {query ? (
            <>
              <Search size={28} />
              <h2>No matches for &ldquo;{query}&rdquo;</h2>
              <p>Try a different name, email address, subject or keyword.</p>
              <Link href={inboxHref(activeView, "")} className="hub-secondary-button">
                Clear search
              </Link>
            </>
          ) : (
            <>
              <Inbox size={28} />
              <h2>
                {activeView === "unread"
                  ? "All caught up"
                  : activeView === "other"
                    ? "No other messages"
                    : "Your inbox is empty"}
              </h2>
              <p>
                {activeView === "other"
                  ? "Previously imported automated messages appear here. Nothing is deleted."
                  : activeView === "unread"
                    ? "You have no unread customer conversations."
                    : "New customer conversations will appear here automatically."}
              </p>
            </>
          )}
        </section>
      ) : (
        <section className="hub-inbox-v2-list" aria-label="Inbox conversations">
          {visibleThreads.map((thread) => {
            const latestMessage = thread.messages[0];
            if (!latestMessage) return null;

            const unreadInThread = thread._count.messages;
            const hasUnread = unreadInThread > 0;
            const messageCount = messageCountMap.get(thread.id) ?? 1;
            const isOther = otherThreads.has(thread.id);

            const contactEmail =
              thread.contact?.email ??
              (latestMessage.direction === "INBOUND"
                ? latestMessage.fromEmail
                : latestMessage.toEmail);

            const contactName =
              thread.contact?.name ||
              (latestMessage.direction === "INBOUND" ? latestMessage.fromName : null) ||
              contactEmail;

            const latestIsInbound = latestMessage.direction === "INBOUND";
            const initials = getInitials(contactName, contactEmail);
            const latestActivityAt = messageActivityDate(latestMessage);

            return (
              <Link
                href={`/hub/thread/${thread.id}`}
                className={`hub-inbox-v2-row ${
                  hasUnread ? "hub-inbox-v2-row-unread" : ""
                }`}
                key={thread.id}
              >
                <div className="hub-inbox-v2-person">
                  <div className="hub-inbox-v2-avatar">
                    {initials}
                    {hasUnread && <span className="hub-inbox-v2-unread-dot" />}
                  </div>

                  <div className="hub-inbox-v2-identity">
                    <div className="hub-inbox-v2-name-line">
                      <strong>{contactName}</strong>
                      {isOther ? (
                        <span className="hub-inbox-v2-badge hub-inbox-v2-badge-other">
                          Other
                        </span>
                      ) : hasUnread ? (
                        <span className="hub-inbox-v2-badge hub-inbox-v2-badge-unread">
                          {unreadInThread} unread
                        </span>
                      ) : latestIsInbound ? (
                        <span className="hub-inbox-v2-badge hub-inbox-v2-badge-reply">
                          Reply
                        </span>
                      ) : (
                        <span className="hub-inbox-v2-badge hub-inbox-v2-badge-done">
                          Replied
                        </span>
                      )}
                    </div>
                    <span className="hub-inbox-v2-email">{contactEmail}</span>
                  </div>
                </div>

                <div className="hub-inbox-v2-content">
                  <strong className="hub-inbox-v2-subject">{thread.subject}</strong>
                  <span className="hub-inbox-v2-preview">
                    {latestMessage.direction === "OUTBOUND" ? "You: " : ""}
                    {createPreview(latestMessage.body)}
                  </span>
                </div>

                <div className="hub-inbox-v2-tail">
                  <time dateTime={latestActivityAt.toISOString()}>
                    {formatDate(latestActivityAt)}
                  </time>

                  <div className="hub-inbox-v2-meta">
                    <span className="hub-inbox-v2-message-count">
                      {messageCount} {messageCount === 1 ? "message" : "messages"}
                    </span>
                    <span className="hub-inbox-v2-open">
                      Open
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {unreadMessageCount > 0 && (
        <div className="hub-inbox-v2-unread-summary">
          {unreadMessageCount} {unreadMessageCount === 1 ? "unread message" : "unread messages"}
        </div>
      )}
    </div>
  );
}
