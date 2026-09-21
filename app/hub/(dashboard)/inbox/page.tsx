import {
  Inbox,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";

import Link from "next/link";

import { prisma } from "@/lib/prisma";
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
  }>;
};

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

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

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
    threads.reduce(
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
          href="/hub/inbox"
          className="hub-secondary-button"
          aria-label="Refresh inbox"
        >
          <RefreshCw size={17} />

          Refresh
        </Link>
      </header>

      {/* TOOLBAR */}

      <div className="hub-toolbar">
        <InboxSearch initialQuery={query} />

        <div className="hub-inbox-total">
          <Inbox size={16} />

          <span>
            {threads.length}{" "}
            {threads.length === 1
              ? "conversation"
              : "conversations"}
            {query && " found"}
          </span>
        </div>
      </div>

      {/* EMPTY INBOX */}

      {threads.length === 0 ? (
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
                href="/hub/inbox"
                className="hub-secondary-button"
              >
                Clear search
              </Link>
            </>
          ) : (
            <>
              <Inbox size={28} />

              <h2>
                Your inbox is empty
              </h2>

              <p>
                New customer conversations
                will appear here
                automatically.
              </p>
            </>
          )}
        </section>
      ) : (
        /*
         * THREAD LIST
         */

        <section className="hub-mail-list">
          {threads.map(
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

                    <Star size={17} />
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