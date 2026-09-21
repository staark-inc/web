import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Plus,
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

  const [projects, counts, activeCount, waitingCount, completedCount] =
    await Promise.all([
      prisma.project.findMany({
        where:
          activeStatus === "ALL"
            ? {}
            : { status: activeStatus as ProjectStatus },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          dueAt: true,
          client: { select: { name: true } },
          tasks: { select: { done: true } },
        },
      }),

      prisma.project.groupBy({
        by: ["status"],
        _count: true,
      }),

      prisma.project.count({ where: { status: "IN_PROGRESS" } }),
      prisma.project.count({ where: { status: "WAITING_CLIENT" } }),
      prisma.project.count({ where: { status: "COMPLETED" } }),
    ]);

  const total = counts.reduce((sum, row) => sum + row._count, 0);

  const countFor = (value: FilterStatus) =>
    value === "ALL"
      ? total
      : counts.find((row) => row.status === value)?._count ?? 0;

  return (
    <div className="hub-page">
      <div className="hub-page-header">
        <div>
          <h1>Projects</h1>

          <p>
            Follow delivery, client materials and launch
            readiness in one place.
          </p>
        </div>

        <Link href="/hub/projects/new" className="hub-send-button">
          <Plus size={15} />
          New project
        </Link>
      </div>

      <section className="hub-client-stats">
        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <FolderKanban size={16} />
            Active projects
          </span>

          <strong>{activeCount}</strong>

          <small>Currently in progress</small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <Clock3 size={16} />
            Waiting on client
          </span>

          <strong>{waitingCount}</strong>

          <small>Materials or approval needed</small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <CheckCircle2 size={16} />
            Completed
          </span>

          <strong>{completedCount}</strong>

          <small>Delivered projects</small>
        </div>
      </section>

      <nav className="hub-lead-filters" aria-label="Project filters">
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
        <div className="hub-client-list">
          {projects.map((project) => {
            const done = project.tasks.filter((task) => task.done).length;
            const totalTasks = project.tasks.length;

            const overdue =
              project.dueAt &&
              project.dueAt < new Date() &&
              project.status !== "COMPLETED";

            return (
              <Link
                key={project.id}
                href={`/hub/projects/${project.id}`}
                className="hub-client-row"
              >
                <div className="hub-client-avatar">
                  <FolderKanban size={17} />
                </div>

                <div className="hub-client-main">
                  <strong>{project.name}</strong>

                  <span className="hub-client-email">
                    <Building2 size={13} />
                    {project.client.name}
                  </span>
                </div>

                <div className="hub-client-meta">
                  <span
                    className={`hub-project-status hub-project-status-${project.status.toLowerCase()}`}
                  >
                    {statusLabels[project.status]}
                  </span>

                  {totalTasks > 0 && (
                    <span>
                      {done}/{totalTasks} tasks
                    </span>
                  )}

                  {project.dueAt && (
                    <time
                      dateTime={project.dueAt.toISOString()}
                      className={overdue ? "hub-project-overdue" : undefined}
                    >
                      {formatDate(project.dueAt)}
                    </time>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
