import Link from "next/link";
import { WorkspaceTabs } from "@/components/hub/WorkspaceTabs";
import { StatusBadge, WorkspacePage, PageHeader, Metrics, Metric, ActionLink, ListCard, ListCardHeader, ListCardFacts, ListCardFact, ListCardFooter } from "@/components/hub/workspace";
import {
  AlertTriangle,
  ArrowRight,
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
    <WorkspacePage className="hub-support-v2-page">
            <PageHeader
        eyebrow="OPERATIONS / SUPPORT"
        title="Support"
        description="Follow client requests, project context, urgency and work recorded in one place."
        action={<ActionLink href="/hub/support/new"><Plus size={16} /> New request</ActionLink>}
      />

            <Metrics label="Support overview">
        <Metric label="Needs action" value={activeCount} description={"Open or in progress"} icon={<LifeBuoy size={18} />} />
        <Metric label="Waiting on client" value={count("WAITING_CLIENT")} description={"Reply or materials needed"} icon={<Clock3 size={18} />} />
        <Metric label="Attention" value={urgentCount} description={`${extraCount} extra-scope request${extraCount === 1 ? "" : "s"}`} icon={<AlertTriangle size={18} />} />
        <Metric label="Open work logged" value={`${timeAggregate._sum.timeSpentMinutes ?? 0} min`} description={`${count("RESOLVED")} resolved total`} icon={<Timer size={18} />} />
      </Metrics>

            <WorkspaceTabs label="Support filters" activeKey={active}
        tabs={filters.map((value) => ({
          key: value,
          label: value === "ALL" ? "All" : supportStatusLabels[value],
          href: value === "ALL" ? "/hub/support" : `/hub/support?status=${value}`,
          count: count(value),
        }))}
      />

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
            <ActionLink href="/hub/support/new" variant="secondary">
              Create request
            </ActionLink>
          )}
        </div>
      ) : (
        <section className="sw-list-card-stack" aria-label="Support requests">
          {requests.map(request => {
            const requester=request.client?.name??request.requesterCompany??request.requesterEmail??'Unmatched requester';
            return <ListCard key={request.id}>
              <ListCardHeader
                icon={<LifeBuoy size={19}/>}
                title={<Link href={'/hub/support/'+request.id}>{request.title}</Link>}
                subtitle={<><span>{requester}</span>{request.project&&<small>{request.project.name}</small>}</>}
                status={<div className="sw-list-card-badges">
                  <StatusBadge tone={request.status==='RESOLVED'?'success':request.status==='WAITING_CLIENT'?'warning':request.status==='IN_PROGRESS'?'info':'neutral'}>{supportStatusLabels[request.status]}</StatusBadge>
                  {request.priority==='URGENT'&&<StatusBadge tone="danger">Urgent</StatusBadge>}
                </div>}
              />
              <ListCardFacts>
                <ListCardFact label="Request"><strong>{supportCategoryLabels[request.category]}</strong><small>{request.reference??'No public reference'}</small></ListCardFact>
                <ListCardFact label="Priority"><strong>{supportPriorityLabels[request.priority]}</strong></ListCardFact>
                <ListCardFact label="Coverage"><strong>{supportCoverageLabels[request.coverage]}</strong></ListCardFact>
                <ListCardFact label="Work recorded"><strong>{request.timeSpentMinutes} min</strong></ListCardFact>
              </ListCardFacts>
              <ListCardFooter>
                <time dateTime={request.updatedAt.toISOString()}>Updated {formatDate(request.updatedAt)}</time>
                <Link href={'/hub/support/'+request.id}>Open request <ArrowRight size={15}/></Link>
              </ListCardFooter>
            </ListCard>;
          })}
        </section>
      )}
    </WorkspacePage>
  );
}
