import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FolderKanban, MessageSquare, Timer } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { supportCoverageLabels, supportStatusLabels } from "@/lib/support";
import { getSupportOptions } from "../options";
import SupportForm from "../SupportForm";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export default async function SupportRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [request, options] = await Promise.all([
    prisma.supportRequest.findUnique({ where: { id }, include: { client: { select: { name: true } }, project: { select: { name: true } }, thread: { select: { subject: true } } } }),
    getSupportOptions(),
  ]);
  if (!request) notFound();

  if (request.threadId && request.thread && !options.threads.some((thread) => thread.id === request.threadId)) {
    options.threads.push({ id: request.threadId, subject: request.thread.subject, clientIds: [request.clientId] });
  }

  return (
    <div className="hub-page">
      <div className="hub-detail-back"><Link href="/hub/support"><ArrowLeft size={16} />Support</Link></div>
      <div className="hub-page-header"><div><span className="hub-eyebrow">SUPPORT REQUEST</span><h1>{request.title}</h1><p>Opened {formatDate(request.createdAt)}{request.resolvedAt ? ` · Resolved ${formatDate(request.resolvedAt)}` : ""}</p></div><span className={`hub-support-status hub-support-status-${request.status.toLowerCase()}`}>{supportStatusLabels[request.status]}</span></div>

      <section className="hub-client-stats">
        <div className="hub-client-stat"><span className="hub-client-stat-label">Plan coverage</span><strong className="hub-support-stat-value">{supportCoverageLabels[request.coverage]}</strong><small>Checked manually against agreement</small></div>
        <div className="hub-client-stat"><span className="hub-client-stat-label"><Timer size={16} />Time spent</span><strong>{request.timeSpentMinutes}</strong><small>Total minutes recorded</small></div>
        <div className="hub-client-stat"><span className="hub-client-stat-label"><Building2 size={16} />Client</span><Link href={`/hub/clients/${request.clientId}`} className="hub-support-stat-link">{request.client.name}</Link><small>Linked client record</small></div>
      </section>

      <div className="hub-support-detail-grid">
        <section className="hub-client-panel"><h2>Request and work notes</h2><SupportForm request={request} options={options} /></section>
        <div className="hub-client-side">
          <div className="hub-client-panel"><h2>Context</h2>
            <div className="hub-support-context"><Building2 size={15} /><Link href={`/hub/clients/${request.clientId}`}>{request.client.name}</Link></div>
            {request.projectId && request.project && <div className="hub-support-context"><FolderKanban size={15} /><Link href={`/hub/projects/${request.projectId}`}>{request.project.name}</Link></div>}
            {request.threadId && request.thread && <div className="hub-support-context"><MessageSquare size={15} /><Link href={`/hub/thread/${request.threadId}`}>{request.thread.subject}</Link></div>}
          </div>
          {request.coverage === "EXTRA" && <div className="hub-client-panel"><h2>Separate offer</h2><p className="hub-client-empty">Check the scope with the client before billing additional work.</p><Link className="hub-secondary-button hub-support-offer-link" href={`/hub/offers/new?clientId=${encodeURIComponent(request.clientId)}`}>Prepare an offer</Link></div>}
        </div>
      </div>
    </div>
  );
}
