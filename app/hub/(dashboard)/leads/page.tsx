import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Globe2,
  Mail,
  MessageCircle,
  Phone,
  Target,
  Trophy,
  UserRoundSearch,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/format";
import type { ContactChannel, LeadStatus } from "@/generated/prisma/client";
import "../../leads-v2-readable.css";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const statuses = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"] as const;
type FilterStatus = "ALL" | (typeof statuses)[number];

const filters: { value: FilterStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

const statusLabels: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  WON: "Won",
  LOST: "Lost",
};

const channelLabels: Record<ContactChannel, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string | null, fallback: string | null) {
  if (!name) return (fallback || "??").slice(0, 2).toUpperCase();

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function contactLabel(lead: {
  contactChannel: ContactChannel;
  contact: { email: string | null; phone: string | null; facebook: string | null };
}) {
  if (lead.contactChannel === "WHATSAPP") return lead.contact.phone || "WhatsApp";
  if (lead.contactChannel === "FACEBOOK") return lead.contact.facebook || "Facebook";
  return lead.contact.email || "Email not added";
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedStatus = params.status?.toUpperCase();

  const activeStatus: FilterStatus =
    requestedStatus && statuses.includes(requestedStatus as (typeof statuses)[number])
      ? (requestedStatus as FilterStatus)
      : "ALL";

  const [totalCount, newCount, contactedCount, qualifiedCount, wonCount, lostCount, leads] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.count({ where: { status: "CONTACTED" } }),
      prisma.lead.count({ where: { status: "QUALIFIED" } }),
      prisma.lead.count({ where: { status: "WON" } }),
      prisma.lead.count({ where: { status: "LOST" } }),
      prisma.lead.findMany({
        where: activeStatus === "ALL" ? undefined : { status: activeStatus as LeadStatus },
        orderBy: { createdAt: "desc" },
        include: {
          contact: true,
          client: { select: { id: true, name: true } },
        },
      }),
    ]);

  const counts: Record<FilterStatus, number> = {
    ALL: totalCount,
    NEW: newCount,
    CONTACTED: contactedCount,
    QUALIFIED: qualifiedCount,
    WON: wonCount,
    LOST: lostCount,
  };

  const activePipeline = newCount + contactedCount + qualifiedCount;
  const decidedCount = wonCount + lostCount;
  const winRate = decidedCount ? Math.round((wonCount / decidedCount) * 100) : 0;

  return (
    <div className="hub-page hub-leads-v2-page">
      <header className="hub-leads-v2-head">
        <div>
          <span className="hub-leads-v2-kicker">SALES / PIPELINE</span>
          <h1>Leads</h1>
          <p>Track new enquiries from first contact through qualification and conversion.</p>
        </div>

        <div className="hub-leads-v2-pipeline-summary">
          <span>{activePipeline} active</span>
          <strong>{winRate}% win rate</strong>
        </div>
      </header>

      <section className="hub-leads-v2-stats" aria-label="Sales pipeline overview">
        <div className="hub-leads-v2-stat">
          <span className="hub-leads-v2-stat-icon hub-leads-v2-stat-icon-new"><Target size={16} /></span>
          <div><small>New</small><strong>{newCount}</strong><span>Needs first contact</span></div>
        </div>
        <div className="hub-leads-v2-stat">
          <span className="hub-leads-v2-stat-icon"><UserRoundSearch size={16} /></span>
          <div><small>Contacted</small><strong>{contactedCount}</strong><span>Conversation started</span></div>
        </div>
        <div className="hub-leads-v2-stat">
          <span className="hub-leads-v2-stat-icon hub-leads-v2-stat-icon-qualified"><CircleDollarSign size={16} /></span>
          <div><small>Qualified</small><strong>{qualifiedCount}</strong><span>Ready for proposal</span></div>
        </div>
        <div className="hub-leads-v2-stat">
          <span className="hub-leads-v2-stat-icon hub-leads-v2-stat-icon-won"><Trophy size={16} /></span>
          <div><small>Won</small><strong>{wonCount}</strong><span>{decidedCount ? `${winRate}% of decided leads` : "No decisions yet"}</span></div>
        </div>
      </section>

      <nav className="hub-leads-v2-filters" aria-label="Lead filters">
        {filters.map((filter) => {
          const active = activeStatus === filter.value;
          const href = filter.value === "ALL" ? "/hub/leads" : `/hub/leads?status=${filter.value}`;
          return (
            <Link key={filter.value} href={href} className={active ? "hub-leads-v2-filter-active" : undefined}>
              <span>{filter.label}</span><strong>{counts[filter.value]}</strong>
            </Link>
          );
        })}
      </nav>

      {leads.length === 0 ? (
        <div className="hub-empty-state">
          <Target size={28} />
          <h2>{activeStatus === "ALL" ? "No leads yet" : `No ${activeStatus.toLowerCase()} leads`}</h2>
          <p>{activeStatus === "ALL" ? "New leads from the website and Prospects will appear here." : "There are no leads with this status."}</p>
        </div>
      ) : (
        <section className="hub-leads-v2-list" aria-label="Lead pipeline">
          {leads.map((lead) => {
            const fallback = lead.contact.email || lead.contact.phone || lead.contact.facebook || lead.contact.company;
            const initials = getInitials(lead.contact.name, fallback);
            const label = contactLabel(lead);

            return (
              <article key={lead.id} className="hub-leads-v2-row">
                <div className="hub-leads-v2-person">
                  <div className="hub-leads-v2-avatar">{initials}</div>
                  <div className="hub-leads-v2-identity">
                    <div className="hub-leads-v2-name-line">
                      <Link href={`/hub/leads/${lead.id}`}>{lead.contact.name || lead.contact.company || "Unknown contact"}</Link>
                      <span className={`hub-lead-status hub-lead-status-${lead.status.toLowerCase()}`}>{statusLabels[lead.status]}</span>
                    </div>
                    <span>
                      {lead.contactChannel === "EMAIL" ? <Mail size={12} /> : lead.contactChannel === "WHATSAPP" ? <MessageCircle size={12} /> : <Globe2 size={12} />}
                      {channelLabels[lead.contactChannel]} · {label}
                    </span>
                    {lead.contact.phone && lead.contactChannel !== "WHATSAPP" && <span><Phone size={12} />{lead.contact.phone}</span>}
                    {lead.contact.company && <span><Building2 size={12} />{lead.contact.company}</span>}
                  </div>
                </div>

                <div className="hub-leads-v2-opportunity">
                  <small>Opportunity</small>
                  <strong>{lead.service || "General enquiry"}</strong>
                  <span>{formatAmount(lead.budget) || "Budget not specified"}</span>
                </div>

                <div className="hub-leads-v2-message">
                  <small>Message</small>
                  <p>{lead.message || "No message was provided."}</p>
                </div>

                <div className="hub-leads-v2-tail">
                  {lead.client ? (
                    <Link href={`/hub/clients/${lead.client.id}`} className="hub-leads-v2-client-link">Client: {lead.client.name}</Link>
                  ) : (
                    <time dateTime={lead.createdAt.toISOString()}>{formatDate(lead.createdAt)}</time>
                  )}
                  <Link href={`/hub/leads/${lead.id}`} className="hub-leads-v2-open">Open<ArrowRight size={13} /></Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
