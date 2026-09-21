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
    ? `${overdueCount} project${overdueCount === 1 ? " is" : "s are"} past deadline and need attention.`
    : waitingCount
      ? `${waitingCount} project${waitingCount === 1 ? " is" : "s are"} waiting on client input.`
      : dueSoonCount
        ? `${dueSoonCount} project${dueSoonCount === 1 ? " is" : "s are"} due within the next 7 days.`
        : "Delivery looks clear. No overdue or near-term deadline signals right now.";

  return (
    <div className="hub-page hub-projects-page">
      <section className="hub-projects-command">
        <div className="hub-projects-command-copy">
          <span className="hub-projects-kicker">DELIVERY CONTROL</span>
          <h1>Projects</h1>
          <p>{deliverySummary}</p>
        </div>

        <Link href="/hub/projects/new" className="hub-projects-new-button">
          <Plus size={15} />
          New project
        </Link>

        <div className="hub-projects-command-metrics">
          <div className="hub-projects-command-metric">
            <span className="hub-projects-command-icon">
              <FolderKanban size={17} />
            </span>
            <div>
              <small>Active delivery</small>
              <strong>{activeCount}</strong>
              <span>In progress or review</span>
            </div>
          </div>

          <div className="hub-projects-command-metric">
            <span className="hub-projects-command-icon hub-projects-command-icon-warning">
              <Clock3 size={17} />
            </span>
            <div>
              <small>Waiting on client</small>
              <strong>{waitingCount}</strong>
              <span>Approval or materials</span>
            </div>
          </div>

          <div className="hub-projects-command-metric">
            <span className="hub-projects-command-icon">
              <CheckCircle2 size={17} />
            </span>
            <div>
              <small>Due in 7 days</small>
              <strong>{dueSoonCount}</strong>
              <span>Upcoming deadlines</span>
            </div>
          </div>

          <div className={`hub-projects-command-metric ${overdueCount ? "hub-projects-command-metric-danger" : ""}`}>
            <span className="hub-projects-command-icon">
              <AlertTriangle size={17} />
            </span>
            <div>
              <small>Overdue</small>
              <strong>{overdueCount}</strong>
              <span>{overdueCount ? "Needs attention" : "All clear"}</span>
            </div>
          </div>
        </div>
      </section>

      <nav
        className="hub-lead-filters hub-projects-filters"
        aria-label="Project filters"
      >
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
              className={`hub-lead-filter ${
                active ? "hub-lead-filter-active" : ""
              }`}
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
        <section className="hub-project-board" aria-label="Project delivery board">
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

            const deadlineTone = overdue
              ? "danger"
              : dueDays !== null && dueDays <= 7
                ? "warning"
                : "neutral";

            const environmentLabel = project.liveUrl
              ? "Live"
              : project.demo
                ? "Demo ready"
                : "No deployment";

            return (
              <article key={project.id} className="hub-project-card">
                <header className="hub-project-card-header">
                  <div className="hub-project-card-identity">
                    <span className="hub-project-card-avatar">
                      <FolderKanban size={17} />
                    </span>

                    <div>
                      <Link href={`/hub/projects/${project.id}`}>
                        {project.name}
                      </Link>

                      <span>
                        <Building2 size={12} />
                        {project.client.name}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`hub-project-status hub-project-status-${project.status.toLowerCase()}`}
                  >
                    {statusLabels[project.status]}
                  </span>
                </header>

                {project.description && (
                  <p className="hub-project-card-description">
                    {project.description}
                  </p>
                )}

                <div className="hub-project-card-progress">
                  <div>
                    <span>
                      <Gauge size={13} />
                      Delivery progress
                    </span>
                    <strong>{progress}%</strong>
                  </div>

                  <div
                    className="hub-project-card-progress-bar"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${progress}%` }} />
                  </div>

                  <small>
                    {totalTasks
                      ? `${done} of ${totalTasks} tasks complete`
                      : "No delivery tasks added yet"}
                  </small>
                </div>

                <div className="hub-project-card-signals">
                  <div className={`hub-project-card-signal hub-project-card-signal-${deadlineTone}`}>
                    <Clock3 size={14} />
                    <div>
                      <small>Deadline</small>
                      <strong>{deadlineLabel}</strong>
                    </div>
                  </div>

                  <div className="hub-project-card-signal">
                    <CheckCircle2 size={14} />
                    <div>
                      <small>Next task</small>
                      <strong>{nextTask?.title ?? "No open tasks"}</strong>
                    </div>
                  </div>

                  <div className={
                    `hub-project-card-signal ${awaitingMaterials ? "hub-project-card-signal-warning" : "hub-project-card-signal-good"}`
                  }>
                    <Package size={14} />
                    <div>
                      <small>Materials</small>
                      <strong>
                        {awaitingMaterials
                          ? `${awaitingMaterials} awaiting`
                          : "Clear"}
                      </strong>
                    </div>
                  </div>

                  <div className={
                    `hub-project-card-signal ${openSupport ? "hub-project-card-signal-warning" : "hub-project-card-signal-good"}`
                  }>
                    <LifeBuoy size={14} />
                    <div>
                      <small>Support</small>
                      <strong>
                        {openSupport
                          ? `${openSupport} open`
                          : "Clear"}
                      </strong>
                    </div>
                  </div>
                </div>

                <footer className="hub-project-card-footer">
                  <div className="hub-project-card-badges">
                    <span className={project.liveUrl || project.demo ? "hub-project-card-badge hub-project-card-badge-good" : "hub-project-card-badge"}>
                      <Rocket size={12} />
                      {environmentLabel}
                    </span>

                    <span className="hub-project-card-updated">
                      Updated {formatDate(project.updatedAt)}
                    </span>
                  </div>

                  <Link
                    href={`/hub/projects/${project.id}`}
                    className="hub-project-card-open"
                  >
                    Open workspace
                    <ArrowRight size={13} />
                  </Link>
                </footer>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
