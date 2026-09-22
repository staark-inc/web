import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Clock3,
  Mail,
  MessageSquareText,
  Pencil,
  Phone,
  Target,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    updated?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getInitials(name: string | null, email: string) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  return email.slice(0, 2).toUpperCase();
}

export default async function ContactDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const contact = await prisma.contact.findUnique({
    where: {
      id,
    },
    include: {
      leads: {
        orderBy: {
          createdAt: "desc",
        },
      },
      clients: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!contact) {
    notFound();
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        {
          fromEmail: contact.email,
        },
        {
          toEmail: contact.email,
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const lastActivityCandidates = [
    contact.updatedAt,
    contact.leads[0]?.updatedAt,
    messages[0]?.createdAt,
  ].filter((value): value is Date => Boolean(value));

  const lastActivity = lastActivityCandidates.sort(
    (a, b) => b.getTime() - a.getTime()
  )[0];

  return (
    <div className="hub-page hub-contact-v2-detail-page">
      <Link href="/hub/contacts" className="hub-contact-v2-back">
        <ArrowLeft size={14} />
        Contacts
      </Link>

      {query.updated === "1" ? (
        <div className="hub-contact-v2-success">
          <strong>Contact updated</strong>
          <span>The contact information has been saved successfully.</span>
        </div>
      ) : null}

      <header className="hub-contact-v2-hero">
        <div className="hub-contact-v2-avatar">
          {getInitials(contact.name, contact.email)}
        </div>

        <div className="hub-contact-v2-title">
          <span className="hub-contact-v2-kicker">CONTACT / CRM</span>
          <h1>{contact.name || "Unknown contact"}</h1>
          <p>
            Contact since {formatDate(contact.createdAt)}
            {contact.company ? ` · ${contact.company}` : ""}
          </p>
        </div>

        <div className="hub-contact-v2-actions">
          <a href={`mailto:${contact.email}`} className="hub-secondary-button">
            <Mail size={14} />
            Email
          </a>

          {contact.clients.length === 0 ? (
            <Link
              href={`/hub/clients/new?contactId=${contact.id}`}
              className="hub-contact-v2-primary"
            >
              <Building2 size={14} />
              Create client
            </Link>
          ) : null}

          <Link
            href={`/hub/contacts/${contact.id}/edit`}
            className="hub-secondary-button"
          >
            <Pencil size={14} />
            Edit
          </Link>
        </div>
      </header>

      <section className="hub-contact-v2-stats" aria-label="Contact summary">
        <div>
          <Target size={15} />
          <span>
            <small>Leads</small>
            <strong>{contact.leads.length}</strong>
          </span>
        </div>

        <div>
          <MessageSquareText size={15} />
          <span>
            <small>Messages</small>
            <strong>{messages.length}</strong>
          </span>
        </div>

        <div>
          <Building2 size={15} />
          <span>
            <small>Client status</small>
            <strong>{contact.clients.length ? "Linked" : "Not linked"}</strong>
          </span>
        </div>

        <div>
          <Clock3 size={15} />
          <span>
            <small>Last activity</small>
            <strong>{lastActivity ? formatDate(lastActivity) : "—"}</strong>
          </span>
        </div>
      </section>

      <div className="hub-contact-v2-grid">
        <section className="hub-contact-v2-panel">
          <div className="hub-contact-v2-panel-head">
            <div>
              <span>PROFILE</span>
              <h2>Contact information</h2>
            </div>

            <UserRound size={16} />
          </div>

          <div className="hub-contact-v2-info">
            <div>
              <Mail size={15} />
              <span>
                <small>Email</small>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </span>
            </div>

            <div>
              <Phone size={15} />
              <span>
                <small>Phone</small>
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                ) : (
                  <strong>Not specified</strong>
                )}
              </span>
            </div>

            <div>
              <Building2 size={15} />
              <span>
                <small>Company</small>
                <strong>{contact.company || "Not specified"}</strong>
              </span>
            </div>
          </div>

          {contact.clients.length > 0 ? (
            <div className="hub-contact-v2-clients">
              <span>LINKED CLIENT{contact.clients.length === 1 ? "" : "S"}</span>

              {contact.clients.map((client) => (
                <Link key={client.id} href={`/hub/clients/${client.id}`}>
                  <Building2 size={14} />
                  {client.name}
                  <ArrowRight size={13} />
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="hub-contact-v2-panel">
          <div className="hub-contact-v2-panel-head">
            <div>
              <span>PIPELINE</span>
              <h2>Lead history</h2>
            </div>

            <strong>{contact.leads.length}</strong>
          </div>

          {contact.leads.length === 0 ? (
            <div className="hub-contact-v2-panel-empty">
              <Target size={20} />
              <p>No leads for this contact yet.</p>
            </div>
          ) : (
            <div className="hub-contact-v2-leads">
              {contact.leads.map((lead) => (
                <Link key={lead.id} href={`/hub/leads/${lead.id}`}>
                  <Target size={14} />

                  <div>
                    <strong>{lead.service || "General enquiry"}</strong>
                    <span>{lead.budget || "No budget specified"}</span>
                  </div>

                  <span
                    className={`hub-lead-status hub-lead-status-${lead.status.toLowerCase()}`}
                  >
                    {lead.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="hub-contact-v2-panel hub-contact-v2-messages-panel">
        <div className="hub-contact-v2-panel-head">
          <div>
            <span>COMMUNICATION</span>
            <h2>Message history</h2>
          </div>

          <strong>{messages.length}</strong>
        </div>

        {messages.length === 0 ? (
          <div className="hub-contact-v2-panel-empty">
            <MessageSquareText size={20} />
            <p>No messages with this contact.</p>
          </div>
        ) : (
          <div className="hub-contact-v2-messages">
            {messages.map((message) => (
              <Link
                key={message.id}
                href={
                  message.direction === "INBOUND"
                    ? `/hub/message/${message.id}`
                    : `/hub/sent/${message.id}`
                }
              >
                <span
                  className={`hub-contact-v2-message-icon hub-contact-v2-message-icon-${message.direction.toLowerCase()}`}
                >
                  <Mail size={13} />
                </span>

                <div className="hub-contact-v2-message-copy">
                  <strong>{message.subject || "(No subject)"}</strong>
                  <span>
                    {message.direction === "INBOUND"
                      ? `From ${contact.name || contact.email}`
                      : "Sent by Staark Inc."}
                  </span>
                </div>

                <div className="hub-contact-v2-message-tail">
                  <span>{message.direction === "INBOUND" ? "Received" : "Sent"}</span>
                  <time dateTime={message.createdAt.toISOString()}>
                    {formatDate(message.createdAt)}
                  </time>
                </div>

                <ArrowRight size={13} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
