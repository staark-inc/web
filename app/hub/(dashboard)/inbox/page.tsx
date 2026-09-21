import {
  Inbox,
  RefreshCw,
  Search,
  Mail,
} from "lucide-react";

import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { isAutomatedSender } from "@/lib/crm-mail";
import InboxSearch from "./InboxSearch";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(
    "sv-SE",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function createPreview(
  value: string,
  maxLength = 120
) {
  const normalized =
    value
      .replace(/\s+/g, " ")
      .trim();

  if (
    normalized.length <= maxLength
  ) {
    return normalized;
  }

  return `${normalized.slice(
    0,
    maxLength
  )}...`;
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

export default async function HubInboxPage({
  searchParams,
}: PageProps) {
  /*
   * Inbox now displays conversations
   * instead of individual messages.
   *
   * Only threads containing at least
   * one inbound customer message belong
   * in Inbox.
   */

  const { q, view } = await searchParams;
  const query = q?.trim() ?? "";
  const activeView: InboxView =
    view === "unread" || view === "other" || view === "all"
      ? view
      : "inbox";

  const threads =
    await prisma.thread.findMany({
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

        /*
         * We only need the latest message
         * here to generate the preview.
         */

        messages: {
          orderBy: {
            createdAt: "desc",
          },

          take: 1,
        },

        /*
         * Count unread inbound messages
         * inside each conversation.
         */

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
   * Count ALL messages per thread.
   *
   * This is intentionally separate from
   * the filtered unread count above.
   */

  const threadIds =
    threads.map(
      (thread) => thread.id
    );

  const messageCounts =
    threadIds.length > 0
      ? await prisma.message.groupBy({
          by: [
            "threadId",
          ],

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

  const messageCountMap =
    new Map<string, number>();

  // Classify older automated conversations that were imported before
  // the Gmail webhook began skipping automated senders.
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
    threads
      .filter((thread) =>
        isAutomatedSender(
          senderByThread.get(thread.id) ?? "",
          process.env.CRM_BLOCKED_SENDERS
        )
      )
      .map((thread) => thread.id)
  );
  const customerThreads = threads.filter((thread) => !otherThreads.has(thread.id));
  const counts: Record<InboxView, number> = {
    inbox: customerThreads.length,
    unread: customerThreads.filter((thread) => thread._count.messages > 0).length,
    other: otherThreads.size,
    all: threads.length,
  };
  const visibleThreads = threads.filter((thread) => {
    if (activeView === "all") return true;
    if (activeView === "other") return otherThreads.has(thread.id);
    return !otherThreads.has(thread.id) &&
      (activeView !== "unread" || thread._count.messages > 0);
  });

  for (
    const item of messageCounts
  ) {
    if (item.threadId) {
      messageCountMap.set(
        item.threadId,
        item._count._all
      );
    }
  }

  /*
   * Total unread customer messages.
   */

  const unreadCount =
    visibleThreads.reduce(
      (total, thread) =>
        total +
        thread._count.messages,
      0
    );

  return (
    <div className="hub-page">
      {/* HEADER */}

      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">
            STAARK HUB
          </span>

          <h1>Inbox</h1>

          <p>
            Conversations and enquiries
            from your customers.
          </p>
        </div>

        <Link
          href={inboxHref(activeView, query)}
          className="hub-secondary-button"
          aria-label="Refresh inbox"
        >
          <RefreshCw size={17} />

          Refresh
        </Link>
      </header>

      {/* TOOLBAR */}

      <div className="hub-toolbar">
        <InboxSearch initialQuery={query} view={activeView} />

        <div className="hub-inbox-total">
          <Inbox size={16} />

          <span>
            {visibleThreads.length}{" "}
            {visibleThreads.length === 1
              ? "conversation"
              : "conversations"}
            {query && " found"}
          </span>
        </div>
      </div>

      <nav className="hub-inbox-tabs" aria-label="Inbox views">
        {([
          ["inbox", "Inbox"],
          ["unread", "Unread"],
          ["other", "Other"],
          ["all", "All mail"],
        ] as const).map(([key, label]) => (
          <Link
            key={key}
            href={inboxHref(key, query)}
            className={`hub-inbox-tab ${activeView === key ? "hub-inbox-tab-active" : ""}`}
            aria-current={activeView === key ? "page" : undefined}
          >
            {label} <span>{counts[key]}</span>
          </Link>
        ))}
      </nav>

      {/* EMPTY INBOX */}

      {visibleThreads.length === 0 ? (
        <section className="hub-empty-inbox">
          {query ? (
            <>
              <Search size={28} />

              <h2>
                No matches for &ldquo;{query}&rdquo;
              </h2>

              <p>
                Try a different name, email
                address, subject or keyword.
              </p>

              <Link
                href={inboxHref(activeView, "")}
                className="hub-secondary-button"
              >
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
        /*
         * THREAD LIST
         */

        <section className="hub-mail-list">
          {visibleThreads.map(
            (thread) => {
              const latestMessage =
                thread.messages[0];

              /*
               * Because our query requires
               * an inbound message, this
               * should normally never happen.
               */
              if (!latestMessage) {
                return null;
              }

              const unreadInThread =
                thread._count.messages;

              const hasUnread =
                unreadInThread > 0;

              const messageCount =
                messageCountMap.get(
                  thread.id
                ) ?? 1;

              /*
               * Prefer CRM contact data.
               *
               * Fallbacks are useful for
               * legacy/imported threads.
               */

              const contactEmail =
                thread.contact
                  ?.email ??
                (latestMessage.direction ===
                "INBOUND"
                  ? latestMessage.fromEmail
                  : latestMessage.toEmail);

              const contactName =
                thread.contact
                  ?.name ||
                (latestMessage.direction ===
                "INBOUND"
                  ? latestMessage.fromName
                  : null) ||
                contactEmail;

              return (
                <Link
                  href={`/hub/thread/${thread.id}`}
                  className={`hub-mail-row ${
                    hasUnread
                      ? "hub-mail-unread"
                      : ""
                  }`}
                  key={thread.id}
                >
                  {/* STATUS */}

                  <div className="hub-mail-status">
                    {hasUnread && (
                      <span className="hub-unread-dot" />
                    )}

                    <Mail size={16} aria-hidden="true" />
                  </div>

                  {/* CUSTOMER */}

                  <div className="hub-mail-sender">
                    <strong>
                      {contactName}
                    </strong>

                    <span>
                      {contactEmail}
                      {" · "}
                      {messageCount}{" "}
                      {messageCount === 1
                        ? "message"
                        : "messages"}
                    </span>
                  </div>

                  {/* SUBJECT + PREVIEW */}

                  <div className="hub-mail-body">
                    <strong>
                      {thread.subject}
                    </strong>

                    <span>
                      {latestMessage.direction ===
                      "OUTBOUND"
                        ? "You: "
                        : ""}

                      {createPreview(
                        latestMessage.body
                      )}
                    </span>
                  </div>

                  {/* LAST ACTIVITY */}

                  <time
                    dateTime={
                      latestMessage.createdAt.toISOString()
                    }
                  >
                    {formatDate(
                      latestMessage.createdAt
                    )}
                  </time>
                </Link>
              );
            }
          )}
        </section>
      )}

      {/* UNREAD SUMMARY */}

      {unreadCount > 0 && (
        <div className="hub-inbox-summary">
          {unreadCount}{" "}
          {unreadCount === 1
            ? "unread message"
            : "unread messages"}
        </div>
      )}
    </div>
  );
}
