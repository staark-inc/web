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

export const statusLabels: Record<ProjectStatus, string> = {
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
      <div className="sw-projects-page">
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
        <div className="sw-projects-workflow">
          <div><span className="sw-eyebrow">DELIVERY COMMAND CENTER</span>
          <strong>Plan <span>→</span> Build <span>→</span> Review <span>→</span> Launch</strong></div>
          <p>Expand a project to see next tasks, deadlines, required materials, support, and deployment.</p>
        </div>
        <div className="sw-projects-section-heading"><div><span className="sw-eyebrow">PROJECT PORTFOLIO</span><h2>Delivery pipeline</h2></div><span>{projects.length} shown</span></div>
      <nav className="hub-projects-v2-filters" aria-label="Project filters">
        {filters.map((filter) => {
          const active = activeStatus === filter.value;

          return (
            <Link
              key={filter.value}
              href={
                filter.value === "ALL"
                  ? "/hub/projects"
                  : `/hub/projects?status=${filter.value}`
              }
              className={active ? "hub-projects-v2-filter-active" : undefined}
            >
              <span>{filter.label}</span>
              <strong>{countFor(filter.value)}</strong>
            </Link>
          );
        })}
      </nav>

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
        <section className="hub-projects-v2-list" aria-label="Projects">
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
              <details key={project.id} className="sw-project-card">
                <summary className="sw-project-summary">
                  <span className="sw-project-icon"><FolderKanban size={19}/></span>
                  <span className="sw-project-ident">
                    <strong>{project.name}</strong>
                    <small><Building2 size={13}/>{project.client.name}</small>
                  </span>
                  <span className="sw-project-progress">
                    <span className="sw-project-progress-line"><strong>{progress}%</strong><small>{done}/{totalTasks} tasks</small></span>
                    <progress max={100} value={progress} aria-label={project.name + " task progress"}/>
                  </span>
                  <span className="sw-project-state">
                    <InfoChip tone={project.status === "COMPLETED" ? "success" : project.status === "WAITING_CLIENT" ? "warning" : project.status === "IN_PROGRESS" ? "info" : "neutral"}>{statusLabels[project.status]}</InfoChip>
                    {overdue && <span className="sw-project-urgent">Overdue</span>}
                  </span>
                  <span className="sw-project-review">Review <ArrowRight size={16}/></span>
                </summary>
                <div className="sw-project-detail">
                  <div className="sw-project-delivery">
                    <div className="sw-project-detail-head"><span className="sw-eyebrow">DELIVERY STATUS</span><strong>{progress}% complete</strong></div>
                    {project.description && <p className="sw-project-description">{project.description}</p>}
                    <div className="sw-project-next">
                      <span className="sw-eyebrow">NEXT TASK</span>
                      <strong>{nextTask ? nextTask.title : totalTasks ? "All recorded tasks completed" : "No tasks assigned yet"}</strong>
                    </div>
                    <div className="sw-project-signals">
                      <span className={overdue ? "is-attention" : ""}><Clock3 size={15}/>{deadlineLabel}</span>
                      <span className={awaitingMaterials ? "is-attention" : ""}><Package size={15}/>{awaitingMaterials ? awaitingMaterials + " materials awaiting" : "Materials clear"}</span>
                      <span className={openSupport ? "is-attention" : ""}><LifeBuoy size={15}/>{openSupport ? openSupport + " support requests" : "Support clear"}</span>
                      <span><Rocket size={15}/>{deploymentLabel}</span>
                    </div>
                    <small className="sw-project-updated">Updated {formatDate(project.updatedAt)}</small>
                  </div>
                  <aside className="sw-project-actions">
                    <span className="sw-eyebrow">NEXT ACTION</span>
                    <strong>{project.client.name}</strong>
                    {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"><Rocket size={15}/> Visit live website <ArrowRight size={14}/></a>}
                    <Link className="sw-project-primary" href={`/hub/projects/${project.id}`}>Open project workspace <ArrowRight size={16}/></Link>
                  </aside>
                </div>
              </details>
            );
          })}
        </section>
      )}
      </div>
    </WorkspacePage>
  );
}
