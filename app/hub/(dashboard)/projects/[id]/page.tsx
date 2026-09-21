import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  LifeBuoy,
  Package,
  Wallet,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/format";
import { supportStatusLabels } from "@/lib/support";

import ProjectForm from "../ProjectForm";
import ProjectTasks from "./ProjectTasks";
import ProjectMaterials from "./ProjectMaterials";
import ProjectActivity from "./ProjectActivity";
import ProjectStatusMenu from "./ProjectStatusMenu";
import LinkThreadForm from "./LinkThreadForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "tasks", label: "Tasks" },
  { value: "billing", label: "Billing & support" },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;

  const activeTab = tabs.some((item) => item.value === tab)
    ? tab
    : "overview";

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      thread: {
        select: {
          id: true,
          subject: true,
          _count: { select: { messages: true } },
        },
      },
      tasks: {
        orderBy: [{ done: "asc" }, { position: "asc" }],
        select: { id: true, title: true, done: true },
      },
      materials: {
        orderBy: { position: "asc" },
        select: { id: true, name: true, status: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          kind: true,
          title: true,
          detail: true,
          createdAt: true,
        },
      },
      supportRequests: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const [clients, threads] = await Promise.all([
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),

    prisma.thread.findMany({
      where: { contact: { clients: { some: { id: project.clientId } } } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, subject: true },
      take: 20,
    }),
  ]);

  const done = project.tasks.filter((task) => task.done).length;

  const receivedMaterials = project.materials.filter(
    (material) => material.status === "RECEIVED"
  ).length;

  return (
    <div className="hub-page">
      <div className="hub-detail-back">
        <Link href="/hub/projects">
          <ArrowLeft size={16} />
          Projects
        </Link>
      </div>

      <div className="hub-page-header">
        <div>
          <p className="hub-project-eyebrow hub-eyebrow">
            <Building2 size={12} />
            <span>Project</span>
            <span aria-hidden="true">·</span>
            <Link href={`/hub/clients/${project.client.id}`}>
              {project.client.name}
            </Link>
          </p>

          <h1>{project.name}</h1>

          {project.description && (
            <p className="hub-subtitle">{project.description}</p>
          )}
        </div>

        <div className="hub-head-actions">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hub-mode"
            >
              <ExternalLink size={13} />
              Live site
            </a>
          )}

          <ProjectStatusMenu
            projectId={project.id}
            status={project.status}
          />
        </div>
      </div>

      <section className="hub-client-stats">
        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <CheckCircle2 size={16} />
            Tasks complete
          </span>

          <strong>
            {done} of {project.tasks.length}
          </strong>

          <small>
            {project.tasks.find((task) => !task.done)
              ? `Next: ${project.tasks.find((task) => !task.done)!.title}`
              : project.tasks.length
                ? "All tasks done"
                : "No tasks yet"}
          </small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <Package size={16} />
            Client materials
          </span>

          <strong>
            {receivedMaterials} of {project.materials.length} received
          </strong>

          <small>
            {project.materials.length
              ? project.materials
                  .filter((material) => material.status === "AWAITING")
                  .map((material) => material.name)
                  .join(", ") || "All materials received"
              : "Nothing requested yet"}
          </small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <CalendarDays size={16} />
            Launch date
          </span>

          <strong>
            {project.dueAt ? formatDate(project.dueAt) : "Not scheduled"}
          </strong>

          <small>
            {project.startedAt
              ? `Started ${formatDate(project.startedAt)}`
              : "Set after client approval"}
          </small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <Wallet size={16} />
            Budget
          </span>

          <strong>
            {formatAmount(project.budget) ?? "Not set"}
          </strong>

          <small>
            {project.liveUrl ? "Live site published" : "Not live yet"}
          </small>
        </div>
      </section>

      <nav className="hub-lead-filters" aria-label="Project sections">
        {tabs.map((item) => (
          <Link
            key={item.value}
            href={
              item.value === "overview"
                ? `/hub/projects/${project.id}`
                : `/hub/projects/${project.id}?tab=${item.value}`
            }
            className={`hub-lead-filter ${
              activeTab === item.value ? "hub-lead-filter-active" : ""
            }`}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {activeTab === "overview" && (
        <section className="hub-client-detail-grid">
          <div className="hub-client-side">
            <ProjectTasks
              projectId={project.id}
              tasks={project.tasks}
              summary
            />

            <ProjectActivity
              projectId={project.id}
              activities={project.activities}
            />
          </div>

          <div className="hub-client-side">
            <ProjectMaterials
              projectId={project.id}
              materials={project.materials}
            />

            <div className="hub-client-panel">
              <h2>
                <MessageSquare size={16} />
                Conversation
              </h2>

              {project.thread ? (
                <div className="hub-project-thread">
                  <Link href={`/hub/thread/${project.thread.id}`}>
                    <strong>{project.thread.subject}</strong>
                  </Link>

                  <span>
                    {project.thread._count.messages} messages
                  </span>
                </div>
              ) : (
                <p className="hub-client-empty">
                  Client messages will appear here once linked.
                </p>
              )}

              <LinkThreadForm
                projectId={project.id}
                threads={threads}
                currentThreadId={project.threadId}
              />
            </div>
          </div>
        </section>
      )}

      {activeTab === "tasks" && (
        <ProjectTasks projectId={project.id} tasks={project.tasks} />
      )}

      {activeTab === "billing" && (
        <section className="hub-client-panel">
          <h2>Billing &amp; support</h2>
          <p className="hub-client-empty">Billing agreements will appear here once recorded. Support requests for this project are listed below.</p>
          <h3 className="hub-support-section-title"><LifeBuoy size={15} /> Support requests</h3>
          {project.supportRequests.length === 0 ? (
            <p className="hub-client-empty">No support requests linked to this project yet.</p>
          ) : (
            <ul className="hub-client-related">
              {project.supportRequests.map((request) => <li key={request.id}><Link href={`/hub/support/${request.id}`}><strong>{request.title}</strong></Link><span>{supportStatusLabels[request.status]}</span></li>)}
            </ul>
          )}
          <Link className="hub-secondary-button hub-support-create-link" href={`/hub/support/new?clientId=${encodeURIComponent(project.clientId)}&projectId=${encodeURIComponent(project.id)}${project.threadId ? `&threadId=${encodeURIComponent(project.threadId)}` : ""}`}>New support request</Link>
        </section>
      )}

      {activeTab === "overview" && (
        <section className="hub-client-panel hub-project-settings">
          <h2>Project details</h2>

          <ProjectForm
            clients={clients}
            project={{
              id: project.id,
              name: project.name,
              clientId: project.clientId,
              description: project.description,
              status: project.status,
              budget: project.budget,
              liveUrl: project.liveUrl,
              startedAt: project.startedAt,
              dueAt: project.dueAt,
            }}
          />
        </section>
      )}
    </div>
  );
}
