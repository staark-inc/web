import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  Plus,
  Timer,
} from "lucide-react";

import type { SupportStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  supportCategoryLabels,
  supportCoverageLabels,
  supportPriorityLabels,
  supportStatusLabels,
} from "@/lib/support";

export const dynamic = "force-dynamic";

const filters = [
  "ALL",
  "OPEN",
  "IN_PROGRESS",
  "WAITING_CLIENT",
  "RESOLVED",
] as const;

type Filter = (typeof filters)[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active: Filter = filters.includes(status as Filter)
    ? (status as Filter)
    : "ALL";

  const [requests, grouped, urgentCount, extraCount, timeAggregate] =
    await Promise.all([
      prisma.supportRequest.findMany({
        where: active === "ALL" ? {} : { status: active as SupportStatus },
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          status: true,
          coverage: true,
          category: true,
          priority: true,
          reference: true,
          requesterCompany: true,
          requesterEmail: true,
          createdAt: true,
          updatedAt: true,
          timeSpentMinutes: true,
          client: { select: { name: true } },
          project: { select: { name: true } },
        },
      }),

      prisma.supportRequest.groupBy({
        by: ["status"],
        _count: true,
      }),

      prisma.supportRequest.count({
        where: {
          priority: "URGENT",
          status: { not: "RESOLVED" },
        },
      }),

      prisma.supportRequest.count({
        where: {
          coverage: "EXTRA",
          status: { not: "RESOLVED" },
        },
      }),

      prisma.supportRequest.aggregate({
        where: { status: { not: "RESOLVED" } },
        _sum: { timeSpentMinutes: true },
      }),
    ]);

  const count = (value: Filter) =>
    value === "ALL"
      ? grouped.reduce((sum, item) => sum + item._count, 0)
      : grouped.find((item) => item.status === value)?._count ?? 0;

  const activeCount = count("OPEN") + count("IN_PROGRESS");

  return (
    <div className="hub-page hub-support-v2-page">
      <header className="hub-workspace-head">
        <div>
          <span className="hub-workspace-kicker">OPERATIONS / SUPPORT</span>
          <h1>Support</h1>
          <p>
            Follow client requests, project context, urgency and work recorded in one place.
          </p>
        </div>

        <Link href="/hub/support/new" className="hub-workspace-primary-action">
          <Plus size={15} />
          New request
        </Link>
      </header>

      <section className="hub-workspace-stats" aria-label="Support overview">
        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon">
            <LifeBuoy size={16} />
          </span>
          <div>
            <small>Needs action</small>
            <strong>{activeCount}</strong>
            <span>Open or in progress</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-info">
            <Clock3 size={16} />
          </span>
          <div>
            <small>Waiting on client</small>
            <strong>{count("WAITING_CLIENT")}</strong>
            <span>Reply or materials needed</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-value">
            <AlertTriangle size={16} />
          </span>
          <div>
            <small>Attention</small>
            <strong>{urgentCount}</strong>
            <span>{extraCount} extra-scope request{extraCount === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-good">
            <Timer size={16} />
          </span>
          <div>
            <small>Open work logged</small>
            <strong>{timeAggregate._sum.timeSpentMinutes ?? 0} min</strong>
            <span>{count("RESOLVED")} resolved total</span>
          </div>
        </div>
      </section>

      <nav className="hub-workspace-filters" aria-label="Support filters">
        {filters.map((value) => (
          <Link
            key={value}
            href={value === "ALL" ? "/hub/support" : `/hub/support?status=${value}`}
            className={active === value ? "hub-workspace-filter-active" : undefined}
            aria-current={active === value ? "page" : undefined}
          >
            <span>{value === "ALL" ? "All" : supportStatusLabels[value]}</span>
            <strong>{count(value)}</strong>
          </Link>
        ))}
      </nav>

      {requests.length === 0 ? (
        <div className="hub-empty-state">
          <LifeBuoy size={28} />
          <h2>{active === "ALL" ? "No support requests yet" : "No requests with this status"}</h2>
          <p>
            {active === "ALL"
              ? "Add a request when a client asks for a change or reports an issue."
              : "Choose another filter to see more requests."}
          </p>
          {active === "ALL" && (
            <Link href="/hub/support/new" className="hub-secondary-button">
              Create request
            </Link>
          )}
        </div>
      ) : (
        <section className="hub-support-v2-list" aria-label="Support requests">
          {requests.map((request) => {
            const requester =
              request.client?.name ??
              request.requesterCompany ??
              request.requesterEmail ??
              "Unmatched requester";

            return (
              <article key={request.id} className="hub-support-v2-row">
                <div className="hub-support-v2-main">
                  <span className="hub-support-v2-icon">
                    <LifeBuoy size={16} />
                  </span>

                  <div>
                    <div className="hub-support-v2-title-line">
                      <Link href={`/hub/support/${request.id}`}>{request.title}</Link>
                      <span className={`hub-support-status hub-support-status-${request.status.toLowerCase()}`}>
                        {supportStatusLabels[request.status]}
                      </span>
                    </div>
                    <span>{requester}</span>
                    {request.project && <small>{request.project.name}</small>}
                  </div>
                </div>

                <div className="hub-support-v2-context">
                  <small>Request</small>
                  <strong>{supportCategoryLabels[request.category]}</strong>
                  <span>{request.reference ?? "No public reference"}</span>
                </div>

                <div className="hub-support-v2-signals">
                  <span className={request.priority === "URGENT" ? "hub-support-v2-chip hub-support-v2-chip-danger" : "hub-support-v2-chip"}>
                    {supportPriorityLabels[request.priority]}
                  </span>
                  <span className={request.coverage === "EXTRA" ? "hub-support-v2-chip hub-support-v2-chip-warning" : request.coverage === "INCLUDED" ? "hub-support-v2-chip hub-support-v2-chip-good" : "hub-support-v2-chip"}>
                    {supportCoverageLabels[request.coverage]}
                  </span>
                  <span className="hub-support-v2-chip">
                    <Timer size={12} />
                    {request.timeSpentMinutes} min
                  </span>
                </div>

                <div className="hub-support-v2-tail">
                  <time dateTime={request.updatedAt.toISOString()}>
                    Updated {formatDate(request.updatedAt)}
                  </time>
                  <Link href={`/hub/support/${request.id}`}>
                    Open
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
