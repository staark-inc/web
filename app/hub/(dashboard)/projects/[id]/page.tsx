import { WorkspaceTabs } from "@/components/hub/WorkspaceTabs";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Clock3,
  ExternalLink,
  Gauge,
  MessageSquare,
  LifeBuoy,
  Package,
  Rocket,
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
import ProjectDemo from "./ProjectDemo";
import ProjectWordPressPanel from "./ProjectWordPressPanel";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "tasks", label: "Tasks" },
  { value: "demo", label: "Demo" },
  { value: "billing", label: "Billing & support" },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ProjectDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;

  const activeTab = tabs.some((item) => item.value === tab) ? tab : "overview";

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
      wordpressSites: {
        orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          siteName: true,
          siteUrl: true,
          adminUrl: true,
          status: true,
          wordpressVersion: true,
          hubVersion: true,
          lastSeenAt: true,
        },
      },
      demo: true,
    },
  });

  if (!project) notFound();

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
  const receivedMaterials = project.materials.filter((material) => material.status === "RECEIVED").length;
  const taskPercent = project.tasks.length
    ? Math.round((done / project.tasks.length) * 100)
    : 0;
  const nextTask = project.tasks.find((task) => !task.done) ?? null;
  const awaitingMaterials = project.materials.filter((material) => material.status === "AWAITING");
  const openSupport = project.supportRequests.filter((request) => request.status !== "RESOLVED").length;

  const now = new Date();
  const dueDays = project.dueAt
    ? Math.ceil((project.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const dueLabel =
    dueDays === null
      ? "No deadline"
      : dueDays < 0
        ? `${Math.abs(dueDays)}d overdue`
        : dueDays === 0
          ? "Due today"
          : `${dueDays}d remaining`;

  const dueTone =
    dueDays === null
      ? "neutral"
      : dueDays < 0
        ? "danger"
        : dueDays <= 7
          ? "warning"
          : "good";

  const deploymentLabel = project.liveUrl
    ? "Live site"
    : project.demo
      ? "Demo ready"
      : "No deployment";

  const deploymentTone = project.liveUrl || project.demo ? "good" : "neutral";

  return (
    <div className="hub-page hub-project-detail-page sw-project-detail-workspace sw-detail-page">
      <div className="hub-detail-back">
        <Link href="/hub/projects">
          <ArrowLeft size={16} />
          Projects
        </Link>
      </div>

      <div className="hub-page-header hub-project-detail-header sw-detail-header">
        <div>
          <p className="hub-project-eyebrow hub-eyebrow">
            <Building2 size={12} />
            <span>Project</span>
            <span aria-hidden="true">·</span>
            <Link href={`/hub/clients/${project.client.id}`}>{project.client.name}</Link>
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

          <ProjectStatusMenu projectId={project.id} status={project.status} />
        </div>
      </div>

      <section className="sw-project-overview-board sw-detail-metrics" aria-label="Project delivery at a glance">
        <div className="sw-project-overview-main">
          <div className="sw-project-overview-kicker"><Gauge size={16}/> DELIVERY PROGRESS</div>
          <div className="sw-project-overview-value">{taskPercent}<span>%</span></div>
          <div className="sw-project-overview-track" role="progressbar" aria-valuenow={taskPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Tasks completed">
            <span style={{ width: `${taskPercent}%` }}/>
          </div>
          <div className="sw-project-overview-caption">{done} / {project.tasks.length} tasks completed</div>
          <div className="sw-project-overview-focus">
            <span>UP NEXT</span>
            <strong>{nextTask?.title ?? (project.tasks.length ? "All recorded tasks complete" : "Add your first task")}</strong>
          </div>
        </div>
        <div className="sw-project-overview-facts">
          <div><Clock3 size={17}/><span>Deadline</span><strong>{dueLabel}</strong></div>
          <div><Package size={17}/><span>Client materials</span><strong>{receivedMaterials} / {project.materials.length} received</strong></div>
          <div><Rocket size={17}/><span>Deployment</span><strong>{deploymentLabel}</strong></div>
          <div><LifeBuoy size={17}/><span>Open support</span><strong>{openSupport}</strong></div>
        </div>
      </section>

      <WorkspaceTabs label="Project sections" activeKey={activeTab ?? "overview"}
        tabs={tabs.map((item) => ({
          key: item.value,
          label: item.label,
          href: item.value === "overview"
            ? `/hub/projects/${project.id}`
            : `/hub/projects/${project.id}?tab=${item.value}`,
          count: item.value === "tasks" ? project.tasks.length
            : item.value === "billing" ? openSupport : undefined,
        }))}/>
      {activeTab === "overview" && (
        <section className="hub-client-detail-grid sw-project-content-grid">
          <div className="hub-client-side">
            <ProjectTasks projectId={project.id} tasks={project.tasks} summary />
            <ProjectActivity projectId={project.id} activities={project.activities} />
          </div>

          <div className="hub-client-side">
            <ProjectWordPressPanel
              projectId={project.id}
              clientId={project.clientId}
              clientName={project.client.name}
              sites={project.wordpressSites.map((site) => ({
                ...site,
                lastSeenAt: site.lastSeenAt?.toISOString() ?? null,
              }))}
            />

            <ProjectMaterials projectId={project.id} materials={project.materials} />

            <div className="hub-client-panel sw-card sw-card-panel sw-detail-panel">
              <h2>
                <MessageSquare size={16} />
                Conversation
              </h2>

              {project.thread ? (
                <div className="hub-project-thread">
                  <Link href={`/hub/thread/${project.thread.id}`}>
                    <strong>{project.thread.subject}</strong>
                  </Link>
                  <span>{project.thread._count.messages} messages</span>
                </div>
              ) : (
                <p className="hub-client-empty">Client messages will appear here once linked.</p>
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

      {activeTab === "demo" && (
        <ProjectDemo projectId={project.id} demo={project.demo} />
      )}

      {activeTab === "billing" && (
        <section className="hub-client-panel sw-card sw-card-panel sw-detail-panel">
          <h2>Billing &amp; support</h2>
          <p className="hub-client-empty">
            Billing agreements will appear here once recorded. Support requests for this project are listed below.
          </p>
          <h3 className="hub-support-section-title">
            <LifeBuoy size={15} /> Support requests
          </h3>
          {project.supportRequests.length === 0 ? (
            <p className="hub-client-empty">No support requests linked to this project yet.</p>
          ) : (
            <ul className="hub-client-related">
              {project.supportRequests.map((request) => (
                <li key={request.id}>
                  <Link href={`/hub/support/${request.id}`}>
                    <strong>{request.title}</strong>
                  </Link>
                  <span>{supportStatusLabels[request.status]}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            className="hub-secondary-button hub-support-create-link"
            href={`/hub/support/new?clientId=${encodeURIComponent(project.clientId)}&projectId=${encodeURIComponent(project.id)}${project.threadId ? `&threadId=${encodeURIComponent(project.threadId)}` : ""}`}
          >
            New support request
          </Link>
        </section>
      )}

      {activeTab === "overview" && (
        <section className="hub-client-panel hub-project-settings sw-card sw-card-panel sw-detail-panel">
          <details className="hub-project-settings-disclosure">
            <summary>
              <span>
                <strong>Project details</strong>
                <small>Client, budget, dates, description and live URL</small>
              </span>
              <span className="hub-project-settings-action">Edit</span>
            </summary>

            <div className="hub-project-settings-body">
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
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
