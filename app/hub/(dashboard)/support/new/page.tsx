import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

import { getSupportOptions } from "../options";
import SupportForm from "../SupportForm";

export const dynamic = "force-dynamic";

export default async function NewSupportRequestPage({ searchParams }: { searchParams: Promise<{ clientId?: string; projectId?: string; threadId?: string }> }) {
  const params = await searchParams;
  const options = await getSupportOptions();
  const clientId = options.clients.some((client) => client.id === params.clientId) ? params.clientId : undefined;
  const projectId = options.projects.some((project) => project.id === params.projectId && project.clientId === clientId) ? params.projectId : undefined;
  const threadId = options.threads.some((thread) => thread.id === params.threadId && (thread.clientIds.includes(clientId ?? "") || options.projects.some((project) => project.id === projectId && project.threadId === thread.id))) ? params.threadId : undefined;

  return (
    <div className="hub-page">
      <div className="hub-detail-back"><Link href="/hub/support"><ArrowLeft size={16} />Support</Link></div>
      <div className="hub-page-header"><div><h1>New support request</h1><p>Keep the client, context and work notes together.</p></div></div>
      {options.clients.length === 0 ? (
        <div className="hub-empty-state"><Building2 size={28} /><h2>Add a client first</h2><p>A support request must belong to a client.</p><Link href="/hub/clients/new" className="hub-secondary-button">New client</Link></div>
      ) : (
        <section className="hub-client-panel"><SupportForm options={options} defaultClientId={clientId} defaultProjectId={projectId} defaultThreadId={threadId} /></section>
      )}
    </div>
  );
}
