import Link from "next/link";
import {
  Building2,
  Mail,
  Target,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/format";
import type { LeadStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const statuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "WON",
  "LOST",
] as const;

type FilterStatus =
  | "ALL"
  | (typeof statuses)[number];

const filters: {
  value: FilterStatus;
  label: string;
}[] = [
  {
    value: "ALL",
    label: "All",
  },
  {
    value: "NEW",
    label: "New",
  },
  {
    value: "CONTACTED",
    label: "Contacted",
  },
  {
    value: "QUALIFIED",
    label: "Qualified",
  },
  {
    value: "WON",
    label: "Won",
  },
  {
    value: "LOST",
    label: "Lost",
  },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function LeadsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const requestedStatus =
    params.status?.toUpperCase();

  const activeStatus: FilterStatus =
    requestedStatus &&
    statuses.includes(
      requestedStatus as (typeof statuses)[number]
    )
      ? (requestedStatus as FilterStatus)
      : "ALL";

  /*
   * Counts are calculated independently from
   * the active filter so the tabs always show
   * the complete CRM totals.
   */
  const [
    totalCount,
    newCount,
    contactedCount,
    qualifiedCount,
    wonCount,
    lostCount,
  ] = await Promise.all([
    prisma.lead.count(),

    prisma.lead.count({
      where: {
        status: "NEW",
      },
    }),

    prisma.lead.count({
      where: {
        status: "CONTACTED",
      },
    }),

    prisma.lead.count({
      where: {
        status: "QUALIFIED",
      },
    }),

    prisma.lead.count({
      where: {
        status: "WON",
      },
    }),

    prisma.lead.count({
      where: {
        status: "LOST",
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

  const leads = await prisma.lead.findMany({
    where:
      activeStatus === "ALL"
        ? undefined
        : {
            status: activeStatus as LeadStatus,
          },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      contact: true,
    },
  });

  return (
    <div className="hub-page">
      <div className="hub-page-header">
        <div>
          <h1>Leads</h1>

          <p>
            Manage potential customers and new
            business opportunities.
          </p>
        </div>

        <div className="hub-leads-summary">
          <span>
            {totalCount} total
          </span>

          {newCount > 0 && (
            <span className="hub-leads-new-count">
              {newCount} new
            </span>
          )}
        </div>
      </div>

      {/* FILTERS */}

      <nav
        className="hub-lead-filters"
        aria-label="Lead filters"
      >
        {filters.map((filter) => {
          const active =
            activeStatus === filter.value;

          const href =
            filter.value === "ALL"
              ? "/hub/leads"
              : `/hub/leads?status=${filter.value}`;

          return (
            <Link
              key={filter.value}
              href={href}
              className={`hub-lead-filter ${
                active
                  ? "hub-lead-filter-active"
                  : ""
              }`}
            >
              <span>
                {filter.label}
              </span>

              <strong>
                {counts[filter.value]}
              </strong>
            </Link>
          );
        })}
      </nav>

      {/* LEADS */}

      {leads.length === 0 ? (
        <div className="hub-empty-state">
          <Target size={28} />

          <h2>
            {activeStatus === "ALL"
              ? "No leads yet"
              : `No ${activeStatus.toLowerCase()} leads`}
          </h2>

          <p>
            {activeStatus === "ALL"
              ? "New leads from the website will appear here."
              : "There are no leads with this status."}
          </p>
        </div>
      ) : (
        <div className="hub-lead-list">
          {leads.map((lead) => {
            const initials =
              lead.contact.name
                ? lead.contact.name
                    .split(" ")
                    .slice(0, 2)
                    .map(
                      (part) =>
                        part[0]
                    )
                    .join("")
                    .toUpperCase()
                : lead.contact.email
                    .slice(0, 2)
                    .toUpperCase();

            return (
              <Link
                key={lead.id}
                href={`/hub/leads/${lead.id}`}
                className="hub-lead-row"
              >
                <div className="hub-lead-avatar">
                  {initials}
                </div>

                <div className="hub-lead-main">
                  <div className="hub-lead-top">
                    <div>
                      <div className="hub-lead-name">
                        {lead.contact.name ||
                          "Unknown contact"}
                      </div>

                      <div className="hub-lead-email">
                        <Mail size={13} />

                        {lead.contact.email}
                      </div>
                    </div>
                  </div>

                  <div className="hub-lead-info">
                    {lead.contact.company && (
                      <span>
                        <Building2
                          size={13}
                        />

                        {
                          lead.contact
                            .company
                        }
                      </span>
                    )}

                    {lead.service && (
                      <span>
                        {lead.service}
                      </span>
                    )}

                    {lead.budget && (
                      <span>
                        {formatAmount(lead.budget)}
                      </span>
                    )}
                  </div>

                  {lead.message && (
                    <p className="hub-lead-preview">
                      {lead.message}
                    </p>
                  )}
                </div>

                <div className="hub-lead-side">
                  <span
                    className={`hub-lead-status hub-lead-status-${lead.status.toLowerCase()}`}
                  >
                    {lead.status}
                  </span>

                  <time className="hub-lead-date">
                    {formatDate(lead.createdAt)}
                  </time>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}