import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CircleDollarSign,
  Mail,
  MessageSquareText,
  Target,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/format";
import LeadStatusForm from "./LeadStatusForm";
import ConvertLeadForm from "./ConvertLeadForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const statusLabels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  WON: "Won",
  LOST: "Lost",
};

export default async function LeadPage({ params }: PageProps) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      contact: true,
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  const displayName = lead.contact.name || "Unknown contact";
  const opportunity = lead.service || "General enquiry";

  return (
    <div className="hub-page hub-lead-v2-detail-page">
      <div className="hub-detail-back">
        <Link href="/hub/leads">
          <ArrowLeft size={16} />
          Leads
        </Link>
      </div>

      <header className="hub-lead-v2-detail-head">
        <div>
          <span className="hub-lead-v2-detail-kicker">
            <Target size={12} />
            SALES OPPORTUNITY
          </span>

          <h1>{opportunity}</h1>

          <p>
            {displayName} · Created {formatDate(lead.createdAt)}
          </p>
        </div>

        <span
          className={`hub-lead-status hub-lead-status-${lead.status.toLowerCase()}`}
        >
          {statusLabels[lead.status] ?? lead.status}
        </span>
      </header>

      <section className="hub-lead-v2-detail-stats">
        <div>
          <span><UserRound size={15} /> Contact</span>
          <strong>{displayName}</strong>
          <small>{lead.contact.email}</small>
        </div>

        <div>
          <span><Building2 size={15} /> Company</span>
          <strong>{lead.contact.company || "Not specified"}</strong>
          <small>{lead.contact.phone || "No phone added"}</small>
        </div>

        <div>
          <span><CircleDollarSign size={15} /> Budget</span>
          <strong>{formatAmount(lead.budget) || "Not specified"}</strong>
          <small>{opportunity}</small>
        </div>

        <div>
          <span><Target size={15} /> Stage</span>
          <strong>{statusLabels[lead.status] ?? lead.status}</strong>
          <small>{lead.client ? "Converted to client" : "Open opportunity"}</small>
        </div>
      </section>

      <section className="hub-lead-v2-detail-grid">
        <div className="hub-lead-v2-panel hub-lead-v2-message-panel">
          <div className="hub-lead-v2-panel-head">
            <div>
              <span>ENQUIRY</span>
              <h2>Message</h2>
            </div>
            <MessageSquareText size={17} />
          </div>

          <div className="hub-lead-v2-message-body">
            {lead.message || "No message was provided."}
          </div>
        </div>

        <div className="hub-lead-v2-panel">
          <div className="hub-lead-v2-panel-head">
            <div>
              <span>CONTACT</span>
              <h2>Customer</h2>
            </div>
          </div>

          <Link
            href={`/hub/contacts/${lead.contact.id}`}
            className="hub-lead-v2-contact-card"
          >
            <span className="hub-lead-v2-contact-icon">
              <UserRound size={17} />
            </span>

            <div>
              <strong>{displayName}</strong>
              <span><Mail size={12} /> {lead.contact.email}</span>
              {lead.contact.company && (
                <span><Building2 size={12} /> {lead.contact.company}</span>
              )}
            </div>
          </Link>
        </div>

        <div className="hub-lead-v2-panel">
          <div className="hub-lead-v2-panel-head">
            <div>
              <span>PIPELINE</span>
              <h2>Next action</h2>
            </div>
          </div>

          {lead.client ? (
            <div className="hub-lead-v2-converted">
              <strong>Converted to client</strong>
              <p>This lead is already connected to an active client record.</p>
              <Link href={`/hub/clients/${lead.client.id}`}>
                Open {lead.client.name}
              </Link>
            </div>
          ) : (
            <div className="hub-lead-v2-actions-stack">
              <div>
                <span>Lead stage</span>
                <LeadStatusForm
                  leadId={lead.id}
                  currentStatus={lead.status}
                />
              </div>

              {lead.status !== "WON" && (
                <div className="hub-lead-v2-convert-block">
                  <span>Ready to close?</span>
                  <ConvertLeadForm
                    leadId={lead.id}
                    defaultName={lead.contact.company || ""}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
