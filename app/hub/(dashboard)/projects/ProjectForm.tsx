"use client";

import { useActionState } from "react";

import {
  createProject,
  updateProject,
  type ProjectFormState,
} from "./actions";

const initialState: ProjectFormState = {
  error: null,
  success: false,
};

const statusOptions = [
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_CLIENT", label: "Waiting on client" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "CANCELLED", label: "Cancelled" },
];

function toDateValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

type ProjectFormProps = {
  clients: { id: string; name: string }[];
  defaultClientId?: string;
  defaultName?: string;
  defaultDescription?: string;
  defaultBudget?: string;
  sourceOffer?: {
    id: string;
    title: string;
  };
  project?: {
    id: string;
    name: string;
    clientId: string;
    description: string | null;
    status: string;
    budget: string | null;
    liveUrl: string | null;
    startedAt: Date | null;
    dueAt: Date | null;
  };
};

export default function ProjectForm({
  clients,
  project,
  defaultClientId,
  defaultName,
  defaultDescription,
  defaultBudget,
  sourceOffer,
}: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(
    project ? updateProject : createProject,
    initialState
  );

  return (
    <form action={formAction} className="hub-client-form">
      {project && (
        <input type="hidden" name="projectId" value={project.id} />
      )}

      {sourceOffer && !project && (
        <>
          <input type="hidden" name="offerId" value={sourceOffer.id} />
          <input
            type="hidden"
            name="clientId"
            value={defaultClientId ?? ""}
          />

          <div className="hub-project-source-offer">
            <span>ACCEPTED OFFER</span>
            <strong>{sourceOffer.title}</strong>
            <small>
              Client, scope and project budget are prefilled from this offer.
            </small>
          </div>
        </>
      )}

      <div className="hub-client-form-grid">
        <div className="hub-client-form-field">
          <label htmlFor="project-name">Project name</label>
          <input
            id="project-name"
            name="name"
            defaultValue={project?.name ?? defaultName ?? ""}
            maxLength={160}
            required
            disabled={pending}
          />
        </div>

        <div className="hub-client-form-field">
          <label htmlFor="project-client">Client</label>
          <select
            id="project-client"
            name={sourceOffer && !project ? undefined : "clientId"}
            defaultValue={project?.clientId ?? defaultClientId ?? ""}
            required
            disabled={pending || Boolean(sourceOffer && !project)}
          >
            <option value="" disabled>
              Select a client
            </option>

            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hub-client-form-field">
          <label htmlFor="project-status">Status</label>
          <select
            id="project-status"
            name="status"
            defaultValue={project?.status ?? "PLANNING"}
            disabled={pending}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="hub-client-form-field">
          <label htmlFor="project-budget">Budget</label>
          <input
            id="project-budget"
            name="budget"
            defaultValue={project?.budget ?? defaultBudget ?? ""}
            placeholder="24 900 SEK"
            disabled={pending}
          />
        </div>

        <div className="hub-client-form-field">
          <label htmlFor="project-started">Start date</label>
          <input
            id="project-started"
            name="startedAt"
            type="date"
            defaultValue={toDateValue(project?.startedAt ?? null)}
            disabled={pending}
          />
        </div>

        <div className="hub-client-form-field">
          <label htmlFor="project-due">Launch date</label>
          <input
            id="project-due"
            name="dueAt"
            type="date"
            defaultValue={toDateValue(project?.dueAt ?? null)}
            disabled={pending}
          />
        </div>
      </div>

      <div className="hub-client-form-field">
        <label htmlFor="project-url">Live URL</label>
        <input
          id="project-url"
          name="liveUrl"
          type="url"
          defaultValue={project?.liveUrl ?? ""}
          placeholder="https://example.com"
          disabled={pending}
        />
      </div>

      <div className="hub-client-form-field">
        <label htmlFor="project-description">Description</label>
        <textarea
          id="project-description"
          name="description"
          rows={4}
          defaultValue={project?.description ?? defaultDescription ?? ""}
          placeholder="Scope, deliverables and notes..."
          disabled={pending}
        />
      </div>

      {state.error && (
        <div className="hub-compose-error">{state.error}</div>
      )}

      {state.success && !state.error && (
        <div className="hub-compose-success">Project saved.</div>
      )}

      <div className="hub-client-form-actions">
        <button
          type="submit"
          className="hub-send-button"
          disabled={pending}
        >
          {pending
            ? "Saving..."
            : project
              ? "Save changes"
              : "Create project"}
        </button>
      </div>
    </form>
  );
}
