import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  Pencil,
  Phone,
  Target,
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

export default async function ContactDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const contact =
    await prisma.contact.findUnique({
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

  const messages =
    await prisma.message.findMany({
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

  const initials = contact.name
    ? contact.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : contact.email
        .slice(0, 2)
        .toUpperCase();

  return (
    <div className="hub-page">
      {/* BACK */}

      <div className="hub-detail-back">
        <Link href="/hub/contacts">
          <ArrowLeft size={16} />
          Contacts
        </Link>
      </div>

      {/* SUCCESS */}

      {query.updated === "1" ? (
        <div className="hub-profile-alert hub-profile-alert-success">
          <div>
            <strong>
              Client updated
            </strong>

            <span>
              The client information has been
              saved successfully.
            </span>
          </div>
        </div>
      ) : null}

      {/* PROFILE */}

      <div className="hub-contact-profile">
        <div className="hub-contact-profile-avatar">
          {initials}
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <h1>
            {contact.name ||
              "Unknown contact"}
          </h1>

          <p>
            Contact since{" "}
            {formatDate(
              contact.createdAt
            )}
          </p>
        </div>

        <div className="hub-detail-actions">
          {contact.clients.length === 0 && (
            <Link
              href={`/hub/clients/new?contactId=${contact.id}`}
              className="hub-secondary-button"
            >
              <Building2 size={15} />
              Create client
            </Link>
          )}

          <Link
            href={`/hub/contacts/${contact.id}/edit`}
            className="hub-secondary-button"
          >
            <Pencil size={15} />
            Edit contact
          </Link>
        </div>
      </div>

      {/* MAIN GRID */}

      {contact.clients.length > 0 && (
        <div className="hub-contact-clients">
          <Building2 size={14} />

          <span>Client:</span>

          {contact.clients.map((client) => (
            <Link key={client.id} href={`/hub/clients/${client.id}`}>
              {client.name}
            </Link>
          ))}
        </div>
      )}

      <div className="hub-detail-grid">
        {/* CONTACT INFORMATION */}

        <section className="hub-detail-card">
          <div className="hub-detail-card-header">
            <h2>
              Contact information
            </h2>
          </div>

          <div className="hub-detail-info">
            <div>
              <Mail size={16} />

              <span>
                <small>
                  Email
                </small>

                <a
                  href={`mailto:${contact.email}`}
                >
                  {contact.email}
                </a>
              </span>
            </div>

            <div>
              <Phone size={16} />

              <span>
                <small>
                  Phone
                </small>

                <strong>
                  {contact.phone ||
                    "Not specified"}
                </strong>
              </span>
            </div>

            <div>
              <Building2 size={16} />

              <span>
                <small>
                  Company
                </small>

                <strong>
                  {contact.company ||
                    "Not specified"}
                </strong>
              </span>
            </div>
          </div>
        </section>

        {/* LEADS */}

        <section className="hub-detail-card">
          <div className="hub-detail-card-header">
            <h2>
              Leads
            </h2>

            <span>
              {contact.leads.length}
            </span>
          </div>

          {contact.leads.length ===
          0 ? (
            <p className="hub-detail-empty">
              No leads for this
              contact yet.
            </p>
          ) : (
            <div className="hub-detail-list">
              {contact.leads.map(
                (lead) => (
                  <Link
                    key={lead.id}
                    href={`/hub/leads/${lead.id}`}
                    className="hub-detail-list-item"
                  >
                    <Target
                      size={16}
                    />

                    <div>
                      <strong>
                        {lead.service ||
                          "General enquiry"}
                      </strong>

                      <span>
                        {lead.budget ||
                          "No budget specified"}
                      </span>
                    </div>

                    <span
                      className={`hub-lead-status hub-lead-status-${lead.status.toLowerCase()}`}
                    >
                      {lead.status}
                    </span>
                  </Link>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* MESSAGE HISTORY */}

      <section className="hub-detail-card">
        <div className="hub-detail-card-header">
          <h2>
            Message history
          </h2>

          <span>
            {messages.length}
          </span>
        </div>

        {messages.length === 0 ? (
          <p className="hub-detail-empty">
            No messages with this
            contact.
          </p>
        ) : (
          <div className="hub-contact-message-list">
            {messages.map(
              (message) => (
                <Link
                  key={message.id}
                  href={
                    message.direction ===
                    "INBOUND"
                      ? `/hub/message/${message.id}`
                      : `/hub/sent/${message.id}`
                  }
                  className="hub-contact-message"
                >
                  <div>
                    <strong>
                      {message.direction ===
                      "INBOUND"
                        ? contact.name ||
                          contact.email
                        : "Staark Inc."}
                    </strong>

                    <span>
                      {message.subject}
                    </span>
                  </div>

                  <div className="hub-contact-message-side">
                    <span
                      className={`hub-message-direction hub-message-direction-${message.direction.toLowerCase()}`}
                    >
                      {message.direction ===
                      "INBOUND"
                        ? "Received"
                        : "Sent"}
                    </span>

                    <time>
                      {formatDate(
                        message.createdAt
                      )}
                    </time>
                  </div>
                </Link>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}