import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Target,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
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
}: PageProps) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },

    include: {
      leads: {
        orderBy: {
          createdAt: "desc",
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

  const initials = contact.name
    ? contact.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : contact.email.slice(0, 2).toUpperCase();

  return (
    <div className="hub-page">
      <div className="hub-detail-back">
        <Link href="/hub/contacts">
          <ArrowLeft size={16} />
          Contacts
        </Link>
      </div>

      <div className="hub-contact-profile">
        <div className="hub-contact-profile-avatar">
          {initials}
        </div>

        <div>
          <h1>
            {contact.name || "Unknown contact"}
          </h1>

          <p>
            Contact since{" "}
            {formatDate(contact.createdAt)}
          </p>
        </div>
      </div>

      <div className="hub-detail-grid">
        {/* CONTACT INFORMATION */}

        <section className="hub-detail-card">
          <h2>Contact information</h2>

          <div className="hub-detail-info">
            <div>
              <Mail size={16} />

              <span>
                <small>Email</small>

                <a href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </span>
            </div>

            <div>
              <Phone size={16} />

              <span>
                <small>Phone</small>

                <strong>
                  {contact.phone || "Not specified"}
                </strong>
              </span>
            </div>

            <div>
              <Building2 size={16} />

              <span>
                <small>Company</small>

                <strong>
                  {contact.company || "Not specified"}
                </strong>
              </span>
            </div>
          </div>
        </section>

        {/* LEADS */}

        <section className="hub-detail-card">
          <div className="hub-detail-card-header">
            <h2>Leads</h2>

            <span>
              {contact.leads.length}
            </span>
          </div>

          {contact.leads.length === 0 ? (
            <p className="hub-detail-empty">
              No leads for this contact yet.
            </p>
          ) : (
            <div className="hub-detail-list">
              {contact.leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/hub/leads/${lead.id}`}
                  className="hub-detail-list-item"
                >
                  <Target size={16} />

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
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MESSAGE HISTORY */}

      <section className="hub-detail-card">
        <div className="hub-detail-card-header">
          <h2>Message history</h2>

          <span>
            {messages.length}
          </span>
        </div>

        {messages.length === 0 ? (
          <p className="hub-detail-empty">
            No messages with this contact.
          </p>
        ) : (
          <div className="hub-contact-message-list">
            {messages.map((message) => (
              <Link
                key={message.id}
                href={
                  message.direction === "INBOUND"
                    ? `/hub/message/${message.id}`
                    : `/hub/sent/${message.id}`
                }
                className="hub-contact-message"
              >
                <div>
                  <strong>
                    {message.direction === "INBOUND"
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
                    {message.direction === "INBOUND"
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}