import {
  ArrowLeft,
  Building2,
  Mail,
  MessageSquare,
  Paperclip,
  Download,
  UserRound,
  ArrowRight,
  Clock3,
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
import { WorkspacePage, InfoChip } from "@/components/hub/workspace";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    returnTo?: string;
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

function safeThreadReturnTo(value: string | undefined) {
  if (!value) return "/hub/inbox";

  try {
    const url = new URL(value, "https://staark.local");
    if (url.origin !== "https://staark.local" || url.pathname !== "/hub/inbox" && url.pathname !== "/hub/sent") {
      return "/hub/inbox";
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return "/hub/inbox";
  }
}

export default async function ThreadPage({
  params,
  searchParams,
}: PageProps) {
  const session =
    await getSession();

  if (!session) {
    redirect("/hub/login");
  }

  const { id } =
    await params;
  const { returnTo } = await searchParams;
  const threadReturnTo = safeThreadReturnTo(returnTo);
  const fromSent = threadReturnTo.startsWith("/hub/sent");

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
    <WorkspacePage>
      <div className="sw-thread-page">
        <nav className="sw-thread-topbar" aria-label="Conversation navigation">
          <Link href={threadReturnTo} className="sw-thread-back">
            <ArrowLeft size={17} aria-hidden="true"/> Back to {fromSent ? "Sent" : "Inbox"}
          </Link>
          <Link href="/hub/compose" className="sw-thread-new"><Mail size={15}/> New message</Link>
        </nav>

        <header className="sw-thread-hero">
          <div className="sw-thread-hero-main">
            <span className="sw-eyebrow">COMMUNICATION / CONVERSATION</span>
            <h1>{thread.subject}</h1>
            <div className="sw-thread-summary">
              <span><MessageSquare size={15}/> {thread.messages.length} {thread.messages.length === 1 ? "message" : "messages"}</span>
              {contactEmail && <span><Mail size={15}/>{contactEmail}</span>}
            </div>
          </div>
          {contactEmail && <a href="#reply" className="sw-thread-reply-shortcut">Write reply <ArrowRight size={15}/></a>}
        </header>

        <div className="sw-thread-workspace">
          <div className="sw-thread-main">
            <div className="sw-thread-timeline-heading">
              <div><span className="sw-eyebrow">MESSAGE HISTORY</span><h2>Conversation</h2></div>
              <span>{thread.messages.length} total</span>
            </div>
            <section className="sw-thread-timeline" aria-label="Conversation messages">
              {thread.messages.map((message) => {
                const isOutbound = message.direction === "OUTBOUND";
                const activityAt = message.sentAt ?? message.createdAt;
                return (
                  <article key={message.id}
                    className={"sw-thread-message " + (isOutbound ? "is-outbound" : "is-inbound")}>
                    <header className="sw-thread-message-header">
                      <span className={"sw-thread-avatar " + (isOutbound ? "is-outbound" : "")}>
                        {isOutbound ? "S" : (message.fromName || contactName || message.fromEmail).slice(0, 1).toUpperCase()}
                      </span>
                      <div className="sw-thread-message-person">
                        <strong>{isOutbound ? "Staark Inc." : message.fromName || contactName || message.fromEmail}</strong>
                        <span>{message.fromEmail}</span>
                      </div>
                      <div className="sw-thread-message-metadata">
                        <InfoChip tone={isOutbound ? "info" : "neutral"}>{isOutbound ? "Sent" : "Received"}</InfoChip>
                        <time dateTime={activityAt.toISOString()}>{formatDate(activityAt)}</time>
                      </div>
                    </header>
                    <div className="sw-thread-message-content">
                      <ThreadMessageBody body={message.body}/>
                    </div>
                    {(attachmentsByMessage.get(message.id)?.length ?? 0) > 0 && (
                      <div className="sw-thread-attachments">
                        <div className="sw-thread-attachments-heading"><Paperclip size={15}/> Attachments</div>
                        {attachmentsByMessage.get(message.id)!.map((attachment) => (
                          <div key={attachment.partId} className="sw-thread-attachment">
                            <a href={"/api/hub/messages/" + message.id + "/attachments/" + encodeURIComponent(attachment.partId)}>
                              <Paperclip size={16}/><span>{attachment.filename}</span>
                              <small>{Math.ceil(attachment.size / 1024)} KB</small><Download size={15}/>
                            </a>
                            {(attachment.mimeType === "application/pdf" || /^image\/(png|jpeg|webp|gif)$/.test(attachment.mimeType)) && (
                              <a className="sw-thread-preview-file"
                                href={"/api/hub/messages/" + message.id + "/attachments/" + encodeURIComponent(attachment.partId) + "?preview=1"}
                                target="_blank" rel="noopener noreferrer">Preview</a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {message.gmailMessageId && (
                      <div className="sw-thread-gmail-attachments">
                        <Suspense fallback={null}>
                          <GmailAttachments messageId={message.id} gmailMessageId={message.gmailMessageId}/>
                        </Suspense>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
            <section id="reply" className="sw-thread-reply-section" aria-label="Reply to conversation">
              {contactEmail ? (
                <ReplyForm threadId={thread.id} to={contactEmail} subject={replySubject}/>
              ) : (
                <div className="sw-thread-no-reply">This conversation has no customer email address, so a reply cannot be sent.</div>
              )}
            </section>
          </div>

          <aside className="sw-thread-sidebar" aria-label="Conversation context">
            <section className="sw-thread-context-card">
              <div className="sw-thread-context-heading"><span className="sw-eyebrow">CUSTOMER CONTEXT</span><h2>Contact details</h2></div>
              <div className="sw-thread-contact-identity">
                <span className="sw-thread-contact-avatar"><UserRound size={21}/></span>
                <div><strong>{contactName || "Unknown contact"}</strong><span>{contactEmail || "Email unavailable"}</span></div>
              </div>
              {thread.contact?.company && (
                <div className="sw-thread-contact-line"><Building2 size={16}/><span>{thread.contact.company}</span></div>
              )}
              {thread.contact && (
                <Link href={"/hub/contacts/" + thread.contact.id} className="sw-thread-contact-link">
                  View CRM contact <ArrowRight size={15}/>
                </Link>
              )}
            </section>
            <section className="sw-thread-context-card sw-thread-activity-card">
              <div className="sw-thread-context-heading"><span className="sw-eyebrow">OVERVIEW</span><h2>Thread activity</h2></div>
              <div className="sw-thread-activity-line"><MessageSquare size={16}/><span>Messages</span><strong>{thread.messages.length}</strong></div>
              {thread.messages.length > 0 && (
                <div className="sw-thread-activity-line">
                  <Clock3 size={16}/><span>Latest activity</span>
                  <strong>{formatDate(thread.messages[thread.messages.length - 1].sentAt ?? thread.messages[thread.messages.length - 1].createdAt)}</strong>
                </div>
              )}
              <Link href={threadReturnTo} className="sw-thread-contact-link">Return to {fromSent ? "Sent" : "Inbox"} <ArrowRight size={15}/></Link>
            </section>
          </aside>
        </div>
      </div>
    </WorkspacePage>
  );
}
