import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CircleDollarSign,
  FileText,
  Globe2,
  Mail,
  MessageCircle,
  MessageSquareText,
  Phone,
  Target,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/format";
import LeadStatusForm from "./LeadStatusForm";
import ConvertLeadForm from "./ConvertLeadForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
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
      client: { select: { id: true, name: true } },
    },
  });

  if (!lead) notFound();

  const displayName = lead.contact.name || lead.contact.company || "Unknown contact";
  const opportunity = lead.service || "General enquiry";
  const channelLabel =
    lead.contactChannel === "WHATSAPP"
      ? "WhatsApp"
      : lead.contactChannel === "FACEBOOK"
        ? "Facebook"
        : "Email";
  const channelValue =
    lead.contactChannel === "WHATSAPP"
      ? lead.contact.phone
      : lead.contactChannel === "FACEBOOK"
        ? lead.contact.facebook
        : lead.contact.email;
  const whatsappNumber = lead.contact.phone?.replace(/\D/g, "") || "";
  const canCreateOffer = !["WON", "LOST"].includes(lead.status);

  return (
    <div className="hub-page hub-lead-v2-detail-page">
      <div className="hub-detail-back">
        <Link href="/hub/leads"><ArrowLeft size={16} />Leads</Link>
      </div>

      <header className="hub-lead-v2-detail-head">
        <div>
          <span className="hub-lead-v2-detail-kicker"><Target size={12} />SALES OPPORTUNITY</span>
          <h1>{opportunity}</h1>
          <p>{displayName} · Created {formatDate(lead.createdAt)}</p>
        </div>
        <span className={`hub-lead-status hub-lead-status-${lead.status.toLowerCase()}`}>
          {statusLabels[lead.status] ?? lead.status}
        </span>
      </header>

      <section className="hub-lead-v2-detail-stats">
        <div>
          <span><UserRound size={15} /> Contact</span>
          <strong>{displayName}</strong>
          <small>{channelLabel}: {channelValue || "Not specified"}</small>
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
          <small>{lead.client ? `Linked to client: ${lead.client.name}` : "Open opportunity"}</small>
        </div>
      </section>

      <section className="hub-lead-v2-detail-grid">
        <div className="hub-lead-v2-panel hub-lead-v2-message-panel">
          <div className="hub-lead-v2-panel-head">
            <div><span>ENQUIRY</span><h2>Message</h2></div>
            <MessageSquareText size={17} />
          </div>
          <div className="hub-lead-v2-message-body">{lead.message || "No message was provided."}</div>
        </div>

        <div className="hub-lead-v2-panel">
          <div className="hub-lead-v2-panel-head">
            <div><span>CONTACT</span><h2>Customer</h2></div>
          </div>

          <Link href={`/hub/contacts/${lead.contact.id}`} className="hub-lead-v2-contact-card">
            <span className="hub-lead-v2-contact-icon"><UserRound size={17} /></span>
            <div>
              <strong>{displayName}</strong>
              {lead.contact.email && <span><Mail size={12} /> {lead.contact.email}</span>}
              {lead.contact.phone && <span><Phone size={12} /> {lead.contact.phone}</span>}
              {lead.contact.facebook && <span><Globe2 size={12} /> {lead.contact.facebook}</span>}
              {lead.contact.company && <span><Building2 size={12} /> {lead.contact.company}</span>}
            </div>
          </Link>

          <div className="hub-lead-v2-actions-stack">
            {lead.contact.email && (
              <a href={`mailto:${lead.contact.email}`} className="hub-secondary-button"><Mail size={14} />Email</a>
            )}
            {lead.contact.phone && whatsappNumber && (
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="hub-secondary-button"><MessageCircle size={14} />WhatsApp</a>
            )}
            {lead.contact.facebook && (
              <a href={lead.contact.facebook} target="_blank" rel="noreferrer" className="hub-secondary-button"><Globe2 size={14} />Facebook</a>
            )}
          </div>
        </div>

        <div className="hub-lead-v2-panel">
          <div className="hub-lead-v2-panel-head">
            <div><span>PIPELINE</span><h2>Next action</h2></div>
          </div>

          <div className="hub-lead-v2-actions-stack">
            <div className="hub-lead-v2-stage-block">
              <span>Lead stage</span>
              <div className="hub-lead-v2-stage-row">
                <LeadStatusForm leadId={lead.id} currentStatus={lead.status} />

                {canCreateOffer && (
                  <Link href={`/hub/offers/new?leadId=${encodeURIComponent(lead.id)}`} className="hub-secondary-button">
                    <FileText size={14} />
                    Create offer
                  </Link>
                )}
              </div>
            </div>

            {lead.client ? (
              <div className="hub-lead-v2-converted">
                <strong>Client record linked</strong>
                <p>Offers created from this lead stay linked to the opportunity. An accepted linked offer marks the lead as won.</p>
                <Link href={`/hub/clients/${lead.client.id}`}>Open {lead.client.name}</Link>
              </div>
            ) : canCreateOffer ? (
              <div className="hub-lead-v2-convert-block">
                <span>Creating an offer will create and link the client automatically. You can still create the client manually for billing before an offer is needed.</span>
                <ConvertLeadForm leadId={lead.id} defaultName={lead.contact.company || ""} />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
