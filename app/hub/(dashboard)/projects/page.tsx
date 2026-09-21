import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Gauge,
  LifeBuoy,
  Package,
  Plus,
  Rocket,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@/generated/prisma/client";

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
    <div className="hub-page hub-projects-v2-page">
      <header className="hub-projects-v2-head">
        <div className="hub-projects-v2-title">
          <span>WORK / DELIVERY</span>
          <h1>Projects</h1>
          <p>{deliverySummary}</p>
        </div>

        <Link href="/hub/projects/new" className="hub-projects-v2-new">
          <Plus size={15} />
          New project
        </Link>
      </header>

      <section className="hub-projects-v2-stats" aria-label="Delivery overview">
        <div className="hub-projects-v2-stat">
          <span className="hub-projects-v2-stat-icon">
            <FolderKanban size={16} />
          </span>
          <div>
            <small>Active</small>
            <strong>{activeCount}</strong>
            <span>In progress or review</span>
          </div>
        </div>

        <div className="hub-projects-v2-stat">
          <span className="hub-projects-v2-stat-icon hub-projects-v2-stat-icon-warning">
            <Clock3 size={16} />
          </span>
          <div>
            <small>Waiting</small>
            <strong>{waitingCount}</strong>
            <span>Client input needed</span>
          </div>
        </div>

        <div className="hub-projects-v2-stat">
          <span className="hub-projects-v2-stat-icon">
            <CheckCircle2 size={16} />
          </span>
          <div>
            <small>Due soon</small>
            <strong>{dueSoonCount}</strong>
            <span>Next 7 days</span>
          </div>
        </div>

        <div className={`hub-projects-v2-stat ${overdueCount ? "hub-projects-v2-stat-danger" : ""}`}>
          <span className="hub-projects-v2-stat-icon">
            <AlertTriangle size={16} />
          </span>
          <div>
            <small>Overdue</small>
            <strong>{overdueCount}</strong>
            <span>{overdueCount ? "Needs attention" : "All clear"}</span>
          </div>
        </div>
      </section>

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
              <article key={project.id} className="hub-projects-v2-item">
                <div className="hub-projects-v2-item-main">
                  <span className="hub-projects-v2-avatar">
                    <FolderKanban size={17} />
                  </span>

                  <div className="hub-projects-v2-identity">
                    <div className="hub-projects-v2-name-line">
                      <Link href={`/hub/projects/${project.id}`}>
                        {project.name}
                      </Link>
                      <span
                        className={`hub-project-status hub-project-status-${project.status.toLowerCase()}`}
                      >
                        {statusLabels[project.status]}
                      </span>
                    </div>

                    <span className="hub-projects-v2-client">
                      <Building2 size={12} />
                      {project.client.name}
                    </span>

                    {project.description && (
                      <p>{project.description}</p>
                    )}
                  </div>
                </div>

                <div className="hub-projects-v2-progress">
                  <div className="hub-projects-v2-progress-top">
                    <span>
                      <Gauge size={13} />
                      Progress
                    </span>
                    <strong>{progress}%</strong>
                  </div>

                  <div className="hub-projects-v2-progress-bar">
                    <span style={{ width: `${progress}%` }} />
                  </div>

                  <span className="hub-projects-v2-progress-sub">
                    {totalTasks
                      ? `${done}/${totalTasks} tasks · `
                      : "No tasks · "}
                    {nextTask ? `Next: ${nextTask.title}` : "No open task"}
                  </span>
                </div>

                <div className="hub-projects-v2-meta">
                  <span className={overdue ? "hub-projects-v2-chip hub-projects-v2-chip-danger" : dueDays !== null && dueDays <= 7 ? "hub-projects-v2-chip hub-projects-v2-chip-warning" : "hub-projects-v2-chip"}>
                    <Clock3 size={13} />
                    {deadlineLabel}
                  </span>

                  <span className={awaitingMaterials ? "hub-projects-v2-chip hub-projects-v2-chip-warning" : "hub-projects-v2-chip hub-projects-v2-chip-good"}>
                    <Package size={13} />
                    {awaitingMaterials ? `${awaitingMaterials} materials` : "Materials clear"}
                  </span>

                  <span className={openSupport ? "hub-projects-v2-chip hub-projects-v2-chip-warning" : "hub-projects-v2-chip hub-projects-v2-chip-good"}>
                    <LifeBuoy size={13} />
                    {openSupport ? `${openSupport} support` : "Support clear"}
                  </span>

                  <span className={project.liveUrl || project.demo ? "hub-projects-v2-chip hub-projects-v2-chip-good" : "hub-projects-v2-chip"}>
                    <Rocket size={13} />
                    {deploymentLabel}
                  </span>
                </div>

                <div className="hub-projects-v2-item-footer">
                  <span>Updated {formatDate(project.updatedAt)}</span>
                  <Link href={`/hub/projects/${project.id}`}>
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
