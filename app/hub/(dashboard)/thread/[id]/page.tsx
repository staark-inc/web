import {
  ArrowLeft,
  Building2,
  Mail,
  MessageSquare,
  Paperclip,
  Download,
  UserRound,
} from "lucide-react";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import GmailAttachments from "./GmailAttachments";
import ThreadMessageBody from "./ThreadMessageBody";
import {
  publishCurrentBadges,
} from "@/lib/realtime";

import ReplyForm from "./ReplyForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(
    "sv-SE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function createReplySubject(
  subject: string
) {
  if (
    /^re:/i.test(
      subject.trim()
    )
  ) {
    return subject;
  }

  return `Re: ${subject}`;
}

export default async function ThreadPage({
  params,
}: PageProps) {
  /*
   * Require Hub login.
   */

  const session =
    await getSession();

  if (!session) {
    redirect("/hub/login");
  }

  const { id } =
    await params;

  /*
   * Load complete conversation.
   */

  const thread =
    await prisma.thread.findUnique({
      where: {
        id,
      },

      include: {
        contact: true,

        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

  if (!thread) {
    notFound();
  }

  const attachmentsByMessage = new Map<string, { partId: string; filename: string; size: number; mimeType: string }[]>();

  const sentAttachments = thread.messages.length ? await prisma.$queryRaw<Array<{ id: string; messageId: string; filename: string; mimeType: string; size: number }>>`
    SELECT "id", "messageId", "filename", "mimeType", "size"
    FROM "MessageAttachment"
    WHERE "messageId" IN (${Prisma.join(thread.messages.map((message) => message.id))})
  ` : [];

  for (const attachment of sentAttachments) {
    const list = attachmentsByMessage.get(attachment.messageId) ?? [];
    list.push({ ...attachment, partId: attachment.id });
    attachmentsByMessage.set(attachment.messageId, list);
  }


  /*
   * Mark inbound messages as read
   * when opening the conversation.
   */

  const readResult =
    await prisma.message.updateMany({
      where: {
        threadId:
          thread.id,

        direction:
          "INBOUND",

        isRead:
          false,
      },

      data: {
        isRead:
          true,
      },
    });

  if (
    readResult.count > 0
  ) {
    await publishCurrentBadges();
  }

  /*
   * Normally this comes from Contact.
   *
   * Fallbacks allow older/imported
   * conversations to still work.
   */

  const firstInbound =
    thread.messages.find(
      (message) =>
        message.direction ===
        "INBOUND"
    );

  const contactEmail =
    thread.contact?.email ??
    firstInbound?.fromEmail ??
    thread.messages[0]
      ?.toEmail ??
    "";

  const contactName =
    thread.contact?.name ??
    firstInbound?.fromName ??
    contactEmail;

  const replySubject =
    createReplySubject(
      thread.subject
    );

  return (
    <div className="hub-page hub-thread-page">
      {/* BACK */}

      <Link
        href="/hub/inbox"
        className="hub-back"
      >
        <ArrowLeft size={15} />

        Back to inbox
      </Link>

      {/* HEADER */}

      <header className="hub-thread-header">
        <div className="hub-thread-heading">
          <span className="hub-eyebrow">
            CONVERSATION
          </span>

          <h1>
            {thread.subject}
          </h1>

          <div className="hub-thread-meta">
            <span>
              <MessageSquare
                size={14}
              />

              {
                thread.messages
                  .length
              }{" "}
              {thread.messages
                .length === 1
                ? "message"
                : "messages"}
            </span>

            {contactEmail && (
              <span>
                <Mail
                  size={14}
                />

                {contactEmail}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* CUSTOMER */}

      {thread.contact && (
        <section className="hub-thread-contact">
          <div className="hub-thread-contact-avatar">
            <UserRound
              size={18}
            />
          </div>

          <div className="hub-thread-contact-info">
            <strong>
              {contactName}
            </strong>

            <span>
              {contactEmail}
            </span>

            {thread.contact
              .company && (
              <span>
                <Building2
                  size={13}
                />

                {
                  thread.contact
                    .company
                }
              </span>
            )}
          </div>

          <Link
            href={`/hub/contacts/${thread.contact.id}`}
            className="hub-secondary-button"
          >
            View client
          </Link>
        </section>
      )}

      {/* CONVERSATION */}

      <section className="hub-thread-conversation">
        {thread.messages.map(
          (message) => {
            const isOutbound =
              message.direction ===
              "OUTBOUND";

            return (
              <article
                key={message.id}
                className={`hub-thread-message ${
                  isOutbound
                    ? "hub-thread-message-outbound"
                    : "hub-thread-message-inbound"
                }`}
              >
                {/* MESSAGE HEADER */}

                <div className="hub-thread-message-header">
                  <div className="hub-thread-message-avatar">
                    {isOutbound
                      ? "S"
                      : (
                          message.fromName ||
                          contactName ||
                          message.fromEmail
                        )
                          .slice(
                            0,
                            1
                          )
                          .toUpperCase()}
                  </div>

                  <div className="hub-thread-message-sender">
                    <strong>
                      {isOutbound
                        ? "Staark Inc."
                        : message.fromName ||
                          contactName ||
                          message.fromEmail}
                    </strong>

                    <span>
                      {isOutbound
                        ? message.fromEmail
                        : message.fromEmail}
                    </span>
                  </div>

                  <div className="hub-thread-message-side">
                    <span
                      className={`hub-message-direction ${
                        isOutbound
                          ? "hub-message-direction-outbound"
                          : "hub-message-direction-inbound"
                      }`}
                    >
                      {isOutbound
                        ? "Sent"
                        : "Received"}
                    </span>

                    <time
                      dateTime={
                        message.createdAt.toISOString()
                      }
                    >
                      {formatDate(
                        message.createdAt
                      )}
                    </time>
                  </div>
                </div>

                {/* MESSAGE BODY */}

                <ThreadMessageBody body={message.body} />

                {(attachmentsByMessage.get(message.id)?.length ?? 0) > 0 && (
                  <div className="hub-thread-attachments">
                    <span className="hub-thread-attachments-title"><Paperclip size={15} /> Attachments</span>
                    {attachmentsByMessage.get(message.id)!.map((attachment) => (
                      <div key={attachment.partId} className="hub-thread-attachment-row">
                        <a
                          href={`/api/hub/messages/${message.id}/attachments/${encodeURIComponent(attachment.partId)}`}
                          className="hub-thread-attachment"
                        >
                          <span><strong>{attachment.filename}</strong><small>{Math.ceil(attachment.size / 1024)} KB</small></span>
                          <Download size={16} aria-hidden="true" />
                        </a>
                        {(attachment.mimeType === "application/pdf" || /^image\/(png|jpeg|webp|gif)$/.test(attachment.mimeType)) && (
                          <a className="hub-thread-attachment-preview" href={`/api/hub/messages/${message.id}/attachments/${encodeURIComponent(attachment.partId)}?preview=1`} target="_blank" rel="noopener noreferrer">Preview</a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {message.gmailMessageId && (
                  <Suspense fallback={null}>
                    <GmailAttachments
                      messageId={message.id}
                      gmailMessageId={message.gmailMessageId}
                    />
                  </Suspense>
                )}
              </article>
            );
          }
        )}
      </section>

      {/* REPLY */}

      {contactEmail ? (
        <ReplyForm
          threadId={
            thread.id
          }
          to={
            contactEmail
          }
          subject={
            replySubject
          }
        />
      ) : (
        <section className="hub-detail-card">
          <p className="hub-detail-empty">
            This conversation has no
            customer email address, so
            a reply cannot be sent.
          </p>
        </section>
      )}
    </div>
  );
}
