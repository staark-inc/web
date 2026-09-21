import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FolderKanban, MessageSquare, Timer } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  supportCategoryLabels,
  supportCoverageLabels,
  supportPriorityLabels,
  supportStatusLabels,
} from "@/lib/support";
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

  if (request.threadId && request.thread && request.clientId && !options.threads.some((thread) => thread.id === request.threadId)) {
    options.threads.push({ id: request.threadId, subject: request.thread.subject, clientIds: [request.clientId] });
  }

  return (
    <div className="hub-page">
      <div className="hub-detail-back"><Link href="/hub/support"><ArrowLeft size={16} />Support</Link></div>
      <div className="hub-page-header"><div><span className="hub-eyebrow">SUPPORT REQUEST</span><h1>{request.title}</h1><p>Opened {formatDate(request.createdAt)}{request.resolvedAt ? ` · Resolved ${formatDate(request.resolvedAt)}` : ""}</p></div><span className={`hub-support-status hub-support-status-${request.status.toLowerCase()}`}>{supportStatusLabels[request.status]}</span></div>

      <section className="hub-client-stats">
        <div className="hub-client-stat"><span className="hub-client-stat-label">Plan coverage</span><strong className="hub-support-stat-value">{supportCoverageLabels[request.coverage]}</strong><small>Checked manually against agreement</small></div>
        <div className="hub-client-stat"><span className="hub-client-stat-label"><Timer size={16} />Time spent</span><strong>{request.timeSpentMinutes}</strong><small>Total minutes recorded</small></div>
        <div className="hub-client-stat"><span className="hub-client-stat-label"><Building2 size={16} />Client</span>{request.clientId && request.client ? <Link href={`/hub/clients/${request.clientId}`} className="hub-support-stat-link">{request.client.name}</Link> : <strong className="hub-support-stat-value">Unmatched</strong>}<small>{request.clientId ? "Linked client record" : request.requesterEmail ?? "Public support request"}</small></div>
      </section>

      <div className="hub-support-detail-grid">
        <section className="hub-client-panel"><h2>Request and work notes</h2><SupportForm request={request} options={options} /></section>
        <div className="hub-client-side">
          <div className="hub-client-panel"><h2>Context</h2>
            {request.clientId && request.client ? <div className="hub-support-context"><Building2 size={15} /><Link href={`/hub/clients/${request.clientId}`}>{request.client.name}</Link></div> : <p className="hub-client-empty">This public request is not linked to a client yet. Choose the correct client in the form to link it.</p>}
            {request.projectId && request.project && <div className="hub-support-context"><FolderKanban size={15} /><Link href={`/hub/projects/${request.projectId}`}>{request.project.name}</Link></div>}
            {request.threadId && request.thread && <div className="hub-support-context"><MessageSquare size={15} /><Link href={`/hub/thread/${request.threadId}`}>{request.thread.subject}</Link></div>}
          </div>
          {(request.requesterEmail || request.reference) && <div className="hub-client-panel"><h2>Public intake</h2><div className="hub-support-context-list">{request.reference && <p><strong>Ticket</strong><span>{request.reference}</span></p>}{request.requesterName && <p><strong>Name</strong><span>{request.requesterName}</span></p>}{request.requesterEmail && <p><strong>Email</strong><span>{request.requesterEmail}</span></p>}{request.requesterCompany && <p><strong>Company</strong><span>{request.requesterCompany}</span></p>}{request.requesterWebsite && <p><strong>Website</strong><span>{request.requesterWebsite}</span></p>}<p><strong>Category</strong><span>{supportCategoryLabels[request.category]}</span></p><p><strong>Priority</strong><span>{supportPriorityLabels[request.priority]}</span></p></div></div>}
          {request.coverage === "EXTRA" && request.clientId && <div className="hub-client-panel"><h2>Separate offer</h2><p className="hub-client-empty">Check the scope with the client before billing additional work.</p><Link className="hub-secondary-button hub-support-offer-link" href={`/hub/offers/new?clientId=${encodeURIComponent(request.clientId)}`}>Prepare an offer</Link></div>}
        </div>
      </div>
    </div>
  );
}
