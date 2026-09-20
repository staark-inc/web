import Link from "next/link";
import {
  MessageSquare,
  Send,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

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
  maxLength = 140
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

export default async function HubSentPage() {
  /*
   * Sent now displays conversations
   * instead of individual outbound messages.
   *
   * Only threads containing at least
   * one OUTBOUND message appear here.
   */

  const threads =
    await prisma.thread.findMany({
      where: {
        messages: {
          some: {
            direction: "OUTBOUND",
          },
        },
      },

      include: {
        contact: true,

        /*
         * Latest OUTBOUND message.
         *
         * Since this is the Sent page,
         * the preview should represent
         * what Staark last sent.
         */

        messages: {
          where: {
            direction: "OUTBOUND",
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 1,
        },

        /*
         * Count every message in
         * the conversation.
         */

        _count: {
          select: {
            messages: true,
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    });

  return (
    <div className="hub-page hub-sent-page">
      {/* HEADER */}

      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">
            STAARK HUB
          </span>

          <h1>Sent</h1>

          <p>
            Conversations you have replied
            to from Staark Hub.
          </p>
        </div>

        <Link
          href="/hub/compose"
          className="hub-header-action"
        >
          <Send size={16} />

          New message
        </Link>
      </header>

      {/* SUMMARY */}

      <div className="hub-toolbar">
        <div className="hub-inbox-total">
          <MessageSquare size={16} />

          <span>
            {threads.length}{" "}
            {threads.length === 1
              ? "conversation"
              : "conversations"}
          </span>
        </div>
      </div>

      {/* LIST */}

      <div className="hub-mail-list">
        {threads.length === 0 ? (
          <div className="hub-empty-state">
            <Send size={24} />

            <h2>
              No sent conversations
            </h2>

            <p>
              Conversations you start or
              reply to from Staark Hub will
              appear here.
            </p>
          </div>
        ) : (
          threads.map(
            (thread) => {
              const latestSent =
                thread.messages[0];

              if (!latestSent) {
                return null;
              }

              const contactEmail =
                thread.contact
                  ?.email ??
                latestSent.toEmail;

              const contactName =
                thread.contact
                  ?.name ||
                contactEmail;

              const messageCount =
                thread._count.messages;

              const sentDate =
                latestSent.sentAt ??
                latestSent.createdAt;

              return (
                <Link
                  key={thread.id}
                  href={`/hub/thread/${thread.id}`}
                  className="hub-mail-row"
                >
                  {/* AVATAR */}

                  <div className="hub-mail-avatar">
                    {contactName
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  {/* CONTENT */}

                  <div className="hub-mail-content">
                    <div className="hub-mail-top">
                      <strong>
                        To: {contactName}
                      </strong>

                      <span>
                        {formatDate(
                          sentDate
                        )}
                      </span>
                    </div>

                    <div className="hub-mail-subject">
                      {thread.subject}
                    </div>

                    <p className="hub-mail-preview">
                      You:{" "}
                      {createPreview(
                        latestSent.body
                      )}
                    </p>

                    <div className="hub-sent-thread-meta">
                      <span>
                        {contactEmail}
                      </span>

                      <span>
                        ·
                      </span>

                      <span>
                        {messageCount}{" "}
                        {messageCount === 1
                          ? "message"
                          : "messages"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }
          )
        )}
      </div>
    </div>
  );
}