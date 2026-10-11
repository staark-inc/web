import { WorkspaceTabs } from "@/components/hub/WorkspaceTabs";
import Link from "next/link";
import { CircleDollarSign, Target, Trophy, UserRoundSearch, MessageCircle, Mail, ArrowRight, ChevronRight, CalendarDays } from "lucide-react";
import { WorkspacePage, PageHeader, Metrics, Metric, InfoChip, EmptyState, SectionHeader } from "@/components/hub/workspace";

import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/format";
import type { ContactChannel, LeadStatus } from "@/generated/prisma/client";

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
    <WorkspacePage>
      <div className="sw-leads-page">
        <PageHeader eyebrow="SALES / PIPELINE" title="Leads"
          description="Track enquiries from first contact to conversion."
          action={
            <div className="sw-leads-summary">
              <span><strong>{activePipeline}</strong> active opportunities</span>
              <span><strong>{winRate}%</strong> win rate</span>
            </div>
          } />
        <Metrics label="Sales pipeline overview">
          <Metric label="New" value={newCount} description="Needs first contact" icon={<Target size={18} />} />
          <Metric label="Contacted" value={contactedCount} description="Conversation started" icon={<UserRoundSearch size={18} />} />
          <Metric label="Qualified" value={qualifiedCount} description="Ready for proposal" icon={<CircleDollarSign size={18} />} />
          <Metric label="Won" value={wonCount} description={decidedCount ? `${winRate}% of decided leads` : "No decisions yet"} icon={<Trophy size={18} />} />
        </Metrics>

        <div className="sw-sales-guide" role="note"><span className="sw-eyebrow">SALES JOURNEY</span><strong>New <span>→</span> Contacted <span>→</span> Qualified <span>→</span> Won</strong><p>Select a lead to review its message and contact options, then open the full record to advance the pipeline.</p></div>
        <section className="sw-leads-listing" aria-label="Leads workspace">
          <div className="sw-leads-toolbar">
            <SectionHeader title="Pipeline" description={`${counts[activeStatus]} lead${counts[activeStatus] === 1 ? "" : "s"} in this view`} />
            <WorkspaceTabs label="Filter leads by status" activeKey={activeStatus}
              tabs={filters.map((filter) => ({
                key: filter.value,
                label: filter.label,
                href: filter.value === "ALL" ? "/hub/leads" : `/hub/leads?status=${filter.value}`,
                count: counts[filter.value],
              }))}/>

          </div>

          {leads.length === 0 ? (
            <EmptyState
              title={activeStatus === "ALL" ? "No leads yet" : `No ${activeStatus.toLowerCase()} leads`}
              description={activeStatus === "ALL" ? "New leads from the website and Prospects will appear here." : "There are no leads with this status."}
            />
          ) : (
            <div className="sw-lead-cards" role="list" aria-label="Lead pipeline">
              {leads.map((lead) => {
                const fallback = lead.contact.email || lead.contact.phone || lead.contact.facebook || lead.contact.company;
                const initials = getInitials(lead.contact.name, fallback);
                const label = contactLabel(lead);
                return (
                  <details key={lead.id} role="listitem" className="sw-lead-card">
                    <summary>
                      <span className="sw-lead-avatar" aria-hidden="true">{initials}</span>
                      <span className="sw-lead-person">
                        <strong>{lead.contact.name || lead.contact.company || "Unknown contact"}</strong>
                        <small>{channelLabels[lead.contactChannel]} · {label}</small>
                      </span>
                      <span className="sw-lead-service">
                        <strong>{lead.service || "General enquiry"}</strong>
                        <small>{formatAmount(lead.budget) || "Budget not specified"}</small>
                      </span>
                      <InfoChip tone={lead.status === "WON" ? "success" : lead.status === "LOST" ? "warning" : lead.status === "NEW" ? "info" : "neutral"}>
                        {statusLabels[lead.status]}
                      </InfoChip>
                      <span className="sw-lead-summary-arrow"><ChevronRight size={17}/></span>
                    </summary>
                    <div className="sw-lead-expanded">
                      <div>
                        <span className="sw-eyebrow">ENQUIRY</span>
                        <p className="sw-lead-full-message">{lead.message || "No message provided."}</p>
                        <span className="sw-lead-date"><CalendarDays size={14}/> Received {formatDate(lead.createdAt)}</span>
                      </div>
                      <div className="sw-lead-quick-actions">
                        <span className="sw-eyebrow">NEXT STEP</span>
                        {lead.contactChannel === "EMAIL" && lead.contact.email && (
                          <Link href={`/hub/compose?replyTo=${encodeURIComponent(lead.contact.email)}`}><Mail size={15}/> Compose email</Link>
                        )}
                        {lead.contact.phone && <a href={`tel:${lead.contact.phone}`}><MessageCircle size={15}/> Call {lead.contact.phone}</a>}
                        {lead.client && <Link href={`/hub/clients/${lead.client.id}`}>View client <ArrowRight size={15}/></Link>}
                        <Link className="sw-lead-open" href={`/hub/leads/${lead.id}`}>Open lead &amp; update status <ArrowRight size={15}/></Link>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </WorkspacePage>
  );
}
