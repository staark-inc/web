import Link from "next/link";
import { CheckCircle2, Clock3, LifeBuoy, Plus } from "lucide-react";

import type { SupportStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { supportCoverageLabels, supportStatusLabels } from "@/lib/support";

export const dynamic = "force-dynamic";

const filters = ["ALL", "OPEN", "IN_PROGRESS", "WAITING_CLIENT", "RESOLVED"] as const;
type Filter = (typeof filters)[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const active: Filter = filters.includes(status as Filter) ? status as Filter : "ALL";
  const [requests, grouped] = await Promise.all([
    prisma.supportRequest.findMany({
      where: active === "ALL" ? {} : { status: active as SupportStatus },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, title: true, status: true, coverage: true, createdAt: true,
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    prisma.supportRequest.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (value: Filter) => value === "ALL"
    ? grouped.reduce((sum, item) => sum + item._count, 0)
    : grouped.find((item) => item.status === value)?._count ?? 0;

  return (
    <div className="hub-page">
      <div className="hub-page-header">
        <div><h1>Support</h1><p>Follow client requests, project context and work done.</p></div>
        <Link href="/hub/support/new" className="hub-send-button"><Plus size={15} />New request</Link>
      </div>

      <section className="hub-client-stats">
        <div className="hub-client-stat"><span className="hub-client-stat-label"><LifeBuoy size={16} />Needs action</span><strong>{count("OPEN") + count("IN_PROGRESS")}</strong><small>Open or in progress</small></div>
        <div className="hub-client-stat"><span className="hub-client-stat-label"><Clock3 size={16} />Waiting on client</span><strong>{count("WAITING_CLIENT")}</strong><small>Awaiting a reply or materials</small></div>
        <div className="hub-client-stat"><span className="hub-client-stat-label"><CheckCircle2 size={16} />Resolved</span><strong>{count("RESOLVED")}</strong><small>Completed support requests</small></div>
      </section>

      <nav className="hub-lead-filters" aria-label="Support filters">
        {filters.map((value) => <Link
          key={value}
          href={value === "ALL" ? "/hub/support" : `/hub/support?status=${value}`}
          className={`hub-lead-filter ${active === value ? "hub-lead-filter-active" : ""}`}
          aria-current={active === value ? "page" : undefined}
        ><span>{value === "ALL" ? "All" : supportStatusLabels[value]}</span><strong>{count(value)}</strong></Link>)}
      </nav>

      <section className="hub-list-section">
        <div className="hub-list-section-header"><div><h2>Support requests</h2><p>Each request stays linked to its client and optional project or conversation.</p></div><span className="hub-list-count">{count("ALL")} requests</span></div>
        {requests.length === 0 ? (
          <div className="hub-empty-state"><LifeBuoy size={28} /><h2>{active === "ALL" ? "No support requests yet" : "No requests with this status"}</h2><p>{active === "ALL" ? "Add a request when a client asks for a change or reports an issue." : "Choose another filter to see more requests."}</p>{active === "ALL" && <Link href="/hub/support/new" className="hub-secondary-button">Create request</Link>}</div>
        ) : (
          <div className="hub-client-list hub-support-list">
            {requests.map((request) => <Link href={`/hub/support/${request.id}`} key={request.id} className="hub-client-row">
              <div className="hub-client-avatar"><LifeBuoy size={17} /></div>
              <div className="hub-client-main"><strong>{request.title}</strong><span className="hub-client-email">{request.client.name}{request.project ? ` · ${request.project.name}` : ""}</span></div>
              <div className="hub-client-meta"><span className={`hub-support-status hub-support-status-${request.status.toLowerCase()}`}>{supportStatusLabels[request.status]}</span><span>{supportCoverageLabels[request.coverage]}</span><time dateTime={request.createdAt.toISOString()}>{formatDate(request.createdAt)}</time></div>
            </Link>)}
          </div>
        )}
      </section>
    </div>
  );
}
