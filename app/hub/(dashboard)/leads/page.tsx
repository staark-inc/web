import Link from "next/link";
import { ArrowRight, CircleDollarSign, Target, Trophy, UserRoundSearch, MessageCircle, Mail, Globe2 } from "lucide-react";
import { WorkspacePage, PageHeader, Metrics, Metric, RecordList, RecordRow, InfoChip, EmptyState, SectionHeader } from "@/components/hub/workspace";

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

        <section className="sw-leads-listing" aria-label="Leads workspace">
          <div className="sw-leads-toolbar">
            <SectionHeader title="Pipeline" description={`${counts[activeStatus]} lead${counts[activeStatus] === 1 ? "" : "s"} in this view`} />
            <nav className="sw-leads-filters" aria-label="Filter leads by status">
              {filters.map((filter) => {
                const active = activeStatus === filter.value;
                const href = filter.value === "ALL" ? "/hub/leads" : `/hub/leads?status=${filter.value}`;
                return <Link key={filter.value} href={href}
                  aria-current={active ? "page" : undefined}
                  className={`sw-leads-filter ${active ? "is-active" : ""}`}>
                  <span>{filter.label}</span><strong>{counts[filter.value]}</strong>
                </Link>;
              })}
            </nav>
          </div>

          {leads.length === 0 ? (
            <EmptyState
              title={activeStatus === "ALL" ? "No leads yet" : `No ${activeStatus.toLowerCase()} leads`}
              description={activeStatus === "ALL" ? "New leads from the website and Prospects will appear here." : "There are no leads with this status."}
            />
          ) : (
            <RecordList label="Lead pipeline">
              {leads.map((lead) => {
                const fallback = lead.contact.email || lead.contact.phone || lead.contact.facebook || lead.contact.company;
                const initials = getInitials(lead.contact.name, fallback);
                const label = contactLabel(lead);
                return <RecordRow key={lead.id} href={`/hub/leads/${lead.id}`} initials={initials}
                  name={lead.contact.name || lead.contact.company || "Unknown contact"}
                  subtitle={
                    <span className="sw-leads-contact">
                      {lead.contactChannel === "EMAIL" ? <Mail size={13} aria-hidden="true" /> : lead.contactChannel === "WHATSAPP" ? <MessageCircle size={13} aria-hidden="true" /> : <Globe2 size={13} aria-hidden="true" />}
                      {channelLabels[lead.contactChannel]} · {label}
                    </span>
                  }
                  details={
                    <div className="sw-leads-details">
                      <div className="sw-leads-opportunity">
                        <strong>{lead.service || "General enquiry"}</strong>
                        <span>{formatAmount(lead.budget) || "Budget not specified"}</span>
                      </div>
                      <p className="sw-leads-message">{lead.message || "No message provided"}</p>
                    </div>
                  }
                  meta={
                    <span className="sw-leads-meta">
                      <InfoChip tone={lead.status === "WON" ? "success" : lead.status === "LOST" ? "warning" : lead.status === "NEW" ? "info" : "neutral"}>
                        {statusLabels[lead.status]}
                      </InfoChip>
                      {lead.client ? <Link className="sw-leads-client" href={`/hub/clients/${lead.client.id}`} onClick={undefined}>Client: {lead.client.name}</Link> :
                        <time dateTime={lead.createdAt.toISOString()}>{formatDate(lead.createdAt)}</time>}
                    </span>
                  }
                />;
              })}
            </RecordList>
          )}
        </section>
      </div>
    </WorkspacePage>
  );
}
