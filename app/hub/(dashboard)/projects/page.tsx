import { WorkspaceTabs } from "@/components/hub/WorkspaceTabs";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FolderKanban,
  LifeBuoy,
  Package,
  Plus,
  Rocket,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@/generated/prisma/client";
import { WorkspacePage, PageHeader, Metrics, Metric, InfoChip } from "@/components/hub/workspace";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const statuses = [
  "PLANNING",
  "IN_PROGRESS",
  "WAITING_CLIENT",
  "REVIEW",
  "COMPLETED",
  "MAINTENANCE",
  "CANCELLED",
] as const;

type FilterStatus = "ALL" | (typeof statuses)[number];

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In progress",
  WAITING_CLIENT: "Waiting on client",
  REVIEW: "Review",
  COMPLETED: "Completed",
  MAINTENANCE: "Maintenance",
  CANCELLED: "Cancelled",
};

const filters: { value: FilterStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_CLIENT", label: "Waiting on client" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

const DAY_MS = 1000 * 60 * 60 * 24;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const { status } = await searchParams;

  const activeStatus: FilterStatus = statuses.includes(
    status as (typeof statuses)[number]
  )
    ? (status as FilterStatus)
    : "ALL";

  const now = new Date();
  const dueSoonCutoff = new Date(now.getTime() + DAY_MS * 7);

  const [
    projects,
    counts,
    activeCount,
    waitingCount,
    dueSoonCount,
    overdueCount,
  ] = await Promise.all([
    prisma.project.findMany({
      where:
        activeStatus === "ALL"
          ? {}
          : { status: activeStatus as ProjectStatus },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        dueAt: true,
        liveUrl: true,
        updatedAt: true,
        client: { select: { name: true } },
        tasks: {
          orderBy: [{ done: "asc" }, { position: "asc" }],
          select: { title: true, done: true },
        },
        materials: { select: { status: true } },
        supportRequests: { select: { status: true } },
        demo: {
          select: {
            slug: true,
            lastDeployedAt: true,
          },
        },
      },
    }),

    prisma.project.groupBy({
      by: ["status"],
      _count: true,
    }),

    prisma.project.count({
      where: { status: { in: ["IN_PROGRESS", "REVIEW"] } },
    }),

    prisma.project.count({
      where: { status: "WAITING_CLIENT" },
    }),

    prisma.project.count({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        dueAt: { gte: now, lte: dueSoonCutoff },
      },
    }),

    prisma.project.count({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        dueAt: { lt: now },
      },
    }),
  ]);

  const total = counts.reduce((sum, row) => sum + row._count, 0);

  const countFor = (value: FilterStatus) =>
    value === "ALL"
      ? total
      : counts.find((row) => row.status === value)?._count ?? 0;

  const deliverySummary = overdueCount
    ? `${overdueCount} project${overdueCount === 1 ? " needs" : "s need"} attention.`
    : waitingCount
      ? `${waitingCount} project${waitingCount === 1 ? " is" : "s are"} waiting on the client.`
      : dueSoonCount
        ? `${dueSoonCount} project${dueSoonCount === 1 ? " is" : "s are"} due within 7 days.`
        : "Delivery is clear. No overdue or near-term deadlines.";

  return (
    <WorkspacePage>
      <div className="sw-projects-page sw-projects-board-page">
        <PageHeader eyebrow="WORK / DELIVERY" title="Projects"
          description={deliverySummary}
          action={<Link href="/hub/projects/new" className="sw-primary-link"><Plus size={16}/> New project</Link>}
        />
        <Metrics label="Delivery overview">
          <Metric label="Active" value={activeCount} description="In progress or review" icon={<FolderKanban size={18}/>}/>
          <Metric label="Waiting" value={waitingCount} description="Client input needed" icon={<Clock3 size={18}/>}/>
          <Metric label="Due soon" value={dueSoonCount} description="Within the next 7 days" icon={<CheckCircle2 size={18}/>}/>
          <Metric label="Overdue" value={overdueCount} description={overdueCount ? "Needs attention" : "All clear"} icon={<AlertTriangle size={18}/>}/>
        </Metrics>
        <div className="sw-projects-section-heading">
          <div><span className="sw-eyebrow">DELIVERY</span><h2>Project portfolio</h2></div>
          <span>{projects.length} shown</span>
        </div>
      <WorkspaceTabs label="Project filters" activeKey={activeStatus}
        tabs={filters.map((filter) => ({
          key: filter.value,
          label: filter.label,
          href: filter.value === "ALL" ? "/hub/projects" : `/hub/projects?status=${filter.value}`,
          count: countFor(filter.value),
        }))}/>


      {projects.length === 0 ? (
        <div className="hub-empty-state">
          <FolderKanban size={28} />
          <h2>
            {activeStatus === "ALL"
              ? "No projects yet"
              : "No projects with this status"}
          </h2>
          <p>
            {activeStatus === "ALL"
              ? "Create a project to track delivery for a client."
              : "Try a different status filter."}
          </p>
          {activeStatus === "ALL" && (
            <Link href="/hub/projects/new" className="hub-secondary-button">
              New project
            </Link>
          )}
        </div>
      ) : (
        <section className="sw-board-grid" aria-label="Projects">
          {projects.map((project) => {
            const done = project.tasks.filter((task) => task.done).length;
            const totalTasks = project.tasks.length;
            const progress = totalTasks
              ? Math.round((done / totalTasks) * 100)
              : 0;
            const nextTask = project.tasks.find((task) => !task.done) ?? null;
            const awaitingMaterials = project.materials.filter(
              (material) => material.status === "AWAITING"
            ).length;
            const openSupport = project.supportRequests.filter(
              (request) => request.status !== "RESOLVED"
            ).length;

            const overdue =
              Boolean(project.dueAt) &&
              project.dueAt! < now &&
              project.status !== "COMPLETED" &&
              project.status !== "CANCELLED";

            const dueDays = project.dueAt
              ? Math.ceil((project.dueAt.getTime() - now.getTime()) / DAY_MS)
              : null;

            const deadlineLabel = !project.dueAt
              ? "No deadline"
              : overdue
                ? `${Math.max(1, Math.ceil((now.getTime() - project.dueAt.getTime()) / DAY_MS))}d overdue`
                : dueDays === 0
                  ? "Due today"
                  : dueDays !== null && dueDays <= 7
                    ? `${dueDays}d remaining`
                    : formatDate(project.dueAt);

            const deploymentLabel = project.liveUrl
              ? "Live"
              : project.demo
                ? "Demo ready"
                : "Not deployed";

            return (
              <article key={project.id} className="sw-board-card">
                <header className="sw-board-card-head">
                  <span className="sw-board-icon"><FolderKanban size={19}/></span>
                  <span className="sw-board-title">
                    <Link href={"/hub/projects/" + project.id}>{project.name}</Link>
                    <small><Building2 size={13}/>{project.client.name}</small>
                  </span>
                  <InfoChip tone={project.status === "COMPLETED" ? "success" : project.status === "WAITING_CLIENT" ? "warning" : project.status === "IN_PROGRESS" ? "info" : "neutral"}>
                    {statusLabels[project.status]}
                  </InfoChip>
                </header>

                <div className="sw-board-card-body">
                  <div className="sw-board-progress-heading">
                    <span>Task progress</span>
                    <strong>{totalTasks ? progress + "%" : "Not started"}</strong>
                  </div>
                  <progress max={100} value={progress} aria-label={project.name + " task completion"}/>
                  <div className="sw-board-task-count">{done} of {totalTasks} tasks complete</div>

                  <div className="sw-board-next-task">
                    <span className="sw-eyebrow">NEXT STEP</span>
                    <strong>{nextTask?.title || (totalTasks ? "All tasks completed" : "Plan your first task")}</strong>
                  </div>

                  <div className="sw-board-facts">
                    <span className={overdue ? "is-urgent" : ""}><Clock3 size={15}/>{deadlineLabel}</span>
                    <span><Rocket size={15}/>{deploymentLabel}</span>
                    {awaitingMaterials > 0 && <span className="is-urgent"><Package size={15}/>{awaitingMaterials} materials waiting</span>}
                    {openSupport > 0 && <span className="is-urgent"><LifeBuoy size={15}/>{openSupport} support requests</span>}
                  </div>
                </div>

                <footer className="sw-board-footer">
                  <small>Updated {formatDate(project.updatedAt)}</small>
                  <Link href={"/hub/projects/" + project.id} className="sw-board-open">
                    Open project <ArrowRight size={15}/>
                  </Link>
                </footer>
              </article>
            );
          })}
        </section>
      )}
      </div>
    </WorkspacePage>
  );
}
