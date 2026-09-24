import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileText,
  FolderKanban,
  MessageSquare,
  Timer,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  supportCategoryLabels,
  supportCoverageLabels,
  supportPriorityLabels,
  supportStatusLabels,
} from "@/lib/support";
import { getSupportOptions } from "../options";
import SupportForm from "../SupportForm";
import { replyToWordPressTicket } from "../actions";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}


type PublicWordPressReply = {
  id: string;
  body: string;
  createdAt: string;
};

function jsonRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function wordpressReplies(payload: unknown): PublicWordPressReply[] {
  const source = jsonRecord(payload);
  if (!source || !Array.isArray(source.hubReplies)) return [];

  return source.hubReplies
    .map((value) => {
      const reply = jsonRecord(value);
      if (!reply) return null;

      const id = typeof reply.id === "string" ? reply.id : "";
      const body = typeof reply.body === "string" ? reply.body : "";
      const createdAt = typeof reply.createdAt === "string" ? reply.createdAt : "";
      if (!id || !body || !createdAt) return null;

      return { id, body, createdAt };
    })
    .filter((reply): reply is PublicWordPressReply => reply !== null);
}

function formatReplyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function SupportRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reply?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const [request, options] = await Promise.all([
    prisma.supportRequest.findUnique({
      where: { id },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
        thread: { select: { subject: true } },
        wordpressTicketSync: {
          select: {
            localId: true,
            payload: true,
            wordpressSite: {
              select: {
                siteName: true,
                siteUrl: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
    }),
    getSupportOptions(),
  ]);

  if (!request) notFound();

  const publicReplies = request.wordpressTicketSync
    ? wordpressReplies(request.wordpressTicketSync.payload)
    : [];

  if (
    request.threadId &&
    request.thread &&
    request.clientId &&
    !options.threads.some((thread) => thread.id === request.threadId)
  ) {
    options.threads.push({
      id: request.threadId,
      subject: request.thread.subject,
      clientIds: [request.clientId],
    });
  }

  return (
    <div className="hub-page hub-support-v2-detail-page">
      <div className="hub-detail-back">
        <Link href="/hub/support">
          <ArrowLeft size={16} />
          Support
        </Link>
      </div>

      {query.reply === "sent" && (
        <p className="hub-compose-success" role="status">
          Response saved. It will appear in WordPress on the next signed support sync.
        </p>
      )}
      {query.reply === "invalid" && (
        <p className="hub-compose-error" role="alert">
          Write a response between 1 and 5000 characters.
        </p>
      )}
      {query.reply === "unavailable" && (
        <p className="hub-compose-error" role="alert">
          This request is not linked to a WordPress ticket.
        </p>
      )}
      {query.reply === "error" && (
        <p className="hub-compose-error" role="alert">
          The response could not be saved.
        </p>
      )}

      <header className="hub-support-v2-detail-head">
        <div>
          <span className="hub-support-v2-detail-kicker">SUPPORT / REQUEST</span>
          <h1>{request.title}</h1>
          <p>
            Opened {formatDate(request.createdAt)}
            {request.resolvedAt ? ` · Resolved ${formatDate(request.resolvedAt)}` : ""}
          </p>
        </div>

        <span className={`hub-support-status hub-support-status-${request.status.toLowerCase()}`}>
          {supportStatusLabels[request.status]}
        </span>
      </header>

      <section className="hub-support-v2-detail-stats">
        <div>
          <span>Coverage</span>
          <strong>{supportCoverageLabels[request.coverage]}</strong>
          <small>{supportPriorityLabels[request.priority]} priority</small>
        </div>

        <div>
          <span>Time spent</span>
          <strong>{request.timeSpentMinutes} min</strong>
          <small>Recorded work time</small>
        </div>

        <div>
          <span>Client</span>
          {request.clientId && request.client ? (
            <Link href={`/hub/clients/${request.clientId}`}>{request.client.name}</Link>
          ) : (
            <strong>Unmatched</strong>
          )}
          <small>{request.requesterEmail ?? "No requester email"}</small>
        </div>

        <div>
          <span>Category</span>
          <strong>{supportCategoryLabels[request.category]}</strong>
          <small>{request.reference ?? "No public reference"}</small>
        </div>
      </section>

      <div className="hub-support-v2-detail-grid">
        <section className="hub-support-v2-panel">
          <div className="hub-support-v2-panel-head">
            <span>WORKSPACE</span>
            <h2>Request and work notes</h2>
          </div>

          <div className="hub-support-v2-panel-body">
            <SupportForm request={request} options={options} />

            {request.wordpressTicketSync && (
              <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--hub-border, #e2e8f0)" }}>
                <div className="hub-support-v2-panel-head">
                  <span>WORDPRESS CLIENT</span>
                  <h2>Public response</h2>
                </div>

                {publicReplies.length > 0 ? (
                  <div className="hub-support-v2-context-list">
                    {publicReplies.map((reply) => (
                      <p key={reply.id}>
                        <strong>Staark Inc. · {formatReplyDate(reply.createdAt)}</strong>
                        <span style={{ whiteSpace: "pre-wrap" }}>{reply.body}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="hub-client-empty">
                    No public response has been sent to this WordPress ticket yet.
                  </p>
                )}

                <form action={replyToWordPressTicket} className="hub-client-form">
                  <input type="hidden" name="requestId" value={request.id} />
                  <div className="hub-client-form-field">
                    <label htmlFor="wordpress-support-reply">Response shown to the client</label>
                    <textarea
                      id="wordpress-support-reply"
                      name="reply"
                      rows={5}
                      maxLength={5000}
                      required
                      placeholder="Write the update or answer that should appear inside the client's WordPress support ticket..."
                    />
                  </div>
                  <p className="hub-support-help">
                    Sending a response sets the ticket to Waiting for client. The message is delivered on the next signed WordPress sync.
                  </p>
                  <div className="hub-client-form-actions">
                    <button type="submit" className="hub-send-button">
                      Send response to WordPress
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>

        <aside>
          <section className="hub-support-v2-panel">
            <div className="hub-support-v2-panel-head">
              <span>LINKED CONTEXT</span>
              <h2>Client and delivery</h2>
            </div>

            <div className="hub-support-v2-panel-body">
              {request.clientId && request.client ? (
                <div className="hub-support-v2-context-row">
                  <Building2 size={15} />
                  <Link href={`/hub/clients/${request.clientId}`}>{request.client.name}</Link>
                </div>
              ) : (
                <div className="hub-support-v2-context-row">
                  <Building2 size={15} />
                  <span>Not linked to a client yet</span>
                </div>
              )}

              {request.projectId && request.project && (
                <div className="hub-support-v2-context-row">
                  <FolderKanban size={15} />
                  <Link href={`/hub/projects/${request.projectId}`}>{request.project.name}</Link>
                </div>
              )}

              {request.threadId && request.thread && (
                <div className="hub-support-v2-context-row">
                  <MessageSquare size={15} />
                  <Link href={`/hub/thread/${request.threadId}`}>{request.thread.subject}</Link>
                </div>
              )}
            </div>
          </section>

          {(request.requesterEmail || request.reference) && (
            <section className="hub-support-v2-panel">
              <div className="hub-support-v2-panel-head">
                <span>PUBLIC INTAKE</span>
                <h2>Requester details</h2>
              </div>

              <div className="hub-support-v2-panel-body hub-support-v2-context-list">
                {request.reference && (
                  <p><strong>Ticket</strong><span>{request.reference}</span></p>
                )}
                {request.requesterName && (
                  <p><strong>Name</strong><span>{request.requesterName}</span></p>
                )}
                {request.requesterEmail && (
                  <p><strong>Email</strong><span>{request.requesterEmail}</span></p>
                )}
                {request.requesterCompany && (
                  <p><strong>Company</strong><span>{request.requesterCompany}</span></p>
                )}
                {request.requesterWebsite && (
                  <p><strong>Website</strong><span>{request.requesterWebsite}</span></p>
                )}
                <p><strong>Category</strong><span>{supportCategoryLabels[request.category]}</span></p>
                <p><strong>Priority</strong><span>{supportPriorityLabels[request.priority]}</span></p>
                {request.wordpressTicketSync && (
                  <>
                    <p><strong>WordPress ticket</strong><span>#{request.wordpressTicketSync.localId}</span></p>
                    <p><strong>Website</strong><span>{request.wordpressTicketSync.wordpressSite.siteName}</span></p>
                  </>
                )}
              </div>
            </section>
          )}

          {request.coverage === "EXTRA" && request.clientId && (
            <section className="hub-support-v2-panel">
              <div className="hub-support-v2-panel-head">
                <span>COMMERCIAL</span>
                <h2>Separate offer</h2>
              </div>

              <div className="hub-support-v2-panel-body">
                <p className="hub-client-empty">
                  Check the scope with the client before billing additional work.
                </p>
                <Link
                  className="hub-secondary-button hub-support-offer-link"
                  href={`/hub/offers/new?clientId=${encodeURIComponent(request.clientId)}`}
                >
                  <FileText size={14} />
                  Prepare an offer
                </Link>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
