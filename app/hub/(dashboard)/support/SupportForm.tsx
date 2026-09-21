"use client";

import { useActionState, useState } from "react";

import { supportCoverageLabels, supportStatusLabels } from "@/lib/support";
import { createSupportRequest, updateSupportRequest, type SupportActionState } from "./actions";

const initial: SupportActionState = { error: null, success: false };

type SupportRequest = {
  id: string;
  clientId: string;
  projectId: string | null;
  threadId: string | null;
  title: string;
  description: string | null;
  internalNotes: string | null;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_CLIENT" | "RESOLVED";
  coverage: "UNASSESSED" | "INCLUDED" | "EXTRA";
  timeSpentMinutes: number;
};

export type SupportOptions = {
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientId: string; threadId: string | null }[];
  threads: { id: string; subject: string; clientIds: string[] }[];
};

export default function SupportForm({
  options,
  request,
  defaultClientId,
  defaultProjectId,
  defaultThreadId,
}: {
  options: SupportOptions;
  request?: SupportRequest;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultThreadId?: string;
}) {
  const [state, action, pending] = useActionState(request ? updateSupportRequest : createSupportRequest, initial);
  const [clientId, setClientId] = useState(request?.clientId ?? defaultClientId ?? "");
  const [projectId, setProjectId] = useState(request?.projectId ?? defaultProjectId ?? "");
  const [threadId, setThreadId] = useState(request?.threadId ?? defaultThreadId ?? "");

  const visibleProjects = options.projects.filter((project) => project.clientId === clientId);
  const visibleThreads = options.threads.filter((thread) =>
    thread.clientIds.includes(clientId) ||
    options.projects.some((project) => project.id === projectId && project.threadId === thread.id)
  );

  return (
    <form action={action} className="hub-client-form">
      {request && <input type="hidden" name="requestId" value={request.id} />}
      {request && <input type="hidden" name="clientId" value={request.clientId} />}
      <div className="hub-client-form-grid">
        <div className="hub-client-form-field">
          <label htmlFor="support-title">Request title</label>
          <input id="support-title" name="title" maxLength={160} required defaultValue={request?.title ?? ""} placeholder="Update opening hours" disabled={pending} />
        </div>
        <div className="hub-client-form-field">
          <label htmlFor="support-client">Client</label>
          <select id="support-client" name={request ? undefined : "clientId"} value={clientId} disabled={pending || Boolean(request)} required onChange={(event) => { setClientId(event.target.value); setProjectId(""); setThreadId(""); }}>
            <option value="" disabled>Select a client</option>
            {options.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </div>
        <div className="hub-client-form-field">
          <label htmlFor="support-project">Project (optional)</label>
          <select id="support-project" name="projectId" value={projectId} disabled={pending || !clientId} onChange={(event) => { setProjectId(event.target.value); setThreadId(""); }}>
            <option value="">No project linked</option>
            {visibleProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </div>
        <div className="hub-client-form-field">
          <label htmlFor="support-thread">Inbox conversation (optional)</label>
          <select id="support-thread" name="threadId" value={threadId} disabled={pending || !clientId} onChange={(event) => setThreadId(event.target.value)}>
            <option value="">No conversation linked</option>
            {visibleThreads.map((thread) => <option key={thread.id} value={thread.id}>{thread.subject}</option>)}
          </select>
        </div>
        <div className="hub-client-form-field">
          <label htmlFor="support-status">Status</label>
          <select id="support-status" name="status" defaultValue={request?.status ?? "OPEN"} disabled={pending}>
            {Object.entries(supportStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="hub-client-form-field">
          <label htmlFor="support-coverage">Plan coverage</label>
          <select id="support-coverage" name="coverage" defaultValue={request?.coverage ?? "UNASSESSED"} disabled={pending}>
            {Object.entries(supportCoverageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="hub-client-form-field">
          <label htmlFor="support-time">Total time spent (minutes)</label>
          <input id="support-time" name="timeSpentMinutes" type="number" min={0} max={600000} required defaultValue={request?.timeSpentMinutes ?? 0} disabled={pending} />
        </div>
      </div>

      <div className="hub-client-form-field">
        <label htmlFor="support-description">What does the client need?</label>
        <textarea id="support-description" name="description" rows={4} maxLength={10000} defaultValue={request?.description ?? ""} placeholder="Describe the request or problem..." disabled={pending} />
      </div>
      <div className="hub-client-form-field">
        <label htmlFor="support-notes">Internal work notes</label>
        <textarea id="support-notes" name="internalNotes" rows={4} maxLength={10000} defaultValue={request?.internalNotes ?? ""} placeholder="Work completed, next steps..." disabled={pending} />
      </div>
      <p className="hub-support-help">Coverage is recorded manually after checking the client agreement. Saving a request does not email or bill the client.</p>
      {state.error && <p className="hub-compose-error" role="alert">{state.error}</p>}
      {state.success && <p className="hub-compose-success" role="status">Support request saved.</p>}
      <div className="hub-client-form-actions"><button type="submit" className="hub-send-button" disabled={pending}>{pending ? "Saving..." : request ? "Save changes" : "Create request"}</button></div>
    </form>
  );
}
