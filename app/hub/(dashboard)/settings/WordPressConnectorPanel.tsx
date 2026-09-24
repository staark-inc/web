"use client";

import { CheckCircle2, Copy, KeyRound, RefreshCw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

type Site = {
  id: string;
  siteName: string;
  siteUrl: string;
  status: string;
  hubVersion: string | null;
  lastSeenAt: string | null;
  clientName: string | null;
  projectName: string | null;
};

type ClientOption = {
  id: string;
  name: string;
  projects: Array<{ id: string; name: string }>;
};

type PairingState =
  | { kind: "idle"; message: ""; code: ""; expiresAt: "" }
  | { kind: "loading"; message: string; code: ""; expiresAt: "" }
  | { kind: "success"; message: string; code: string; expiresAt: string }
  | { kind: "error"; message: string; code: ""; expiresAt: "" };

export default function WordPressConnectorPanel({
  sites,
  clients,
}: {
  sites: Site[];
  clients: ClientOption[];
}) {
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [state, setState] = useState<PairingState>({
    kind: "idle",
    message: "",
    code: "",
    expiresAt: "",
  });
  const [copied, setCopied] = useState(false);

  const projects = useMemo(
    () => clients.find((client) => client.id === clientId)?.projects ?? [],
    [clientId, clients]
  );

  async function createPairingCode() {
    setState({
      kind: "loading",
      message: "Creating pairing code…",
      code: "",
      expiresAt: "",
    });
    setCopied(false);

    try {
      const response = await fetch("/api/hub/integrations/wordpress/pairing-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || null,
          projectId: projectId || null,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.code) {
        throw new Error(data?.error || "Could not create pairing code.");
      }

      const expires = new Intl.DateTimeFormat("sv-SE", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(data.expiresAt));

      setState({
        kind: "success",
        message: `One-time code · expires ${expires}`,
        code: data.code,
        expiresAt: data.expiresAt,
      });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not create pairing code.",
        code: "",
        expiresAt: "",
      });
    }
  }

  async function copyCode() {
    if (state.kind !== "success") return;
    await navigator.clipboard.writeText(state.code);
    setCopied(true);
  }

  return (
    <article className="hub-settings-v2-integration-card hub-settings-v2-integration-card-stripe">
      <div className="hub-settings-v2-integration-card-head">
        <span className="hub-settings-v2-integration-icon"><KeyRound size={19} /></span>
        <div>
          <strong>Staark WordPress Connector</strong>
          <span>Pair managed WordPress websites and sync support requests into Hub.</span>
        </div>
        <span className={sites.length > 0 ? "hub-settings-v2-status is-connected" : "hub-settings-v2-status is-offline"}>
          {sites.length > 0 ? `${sites.length} connected` : "No sites"}
        </span>
      </div>

      {sites.length > 0 && (
        <div className="hub-settings-v2-integration-facts">
          {sites.slice(0, 4).map((site) => (
            <div key={site.id}>
              <span>{site.clientName || site.projectName || "WordPress site"}</span>
              <strong>{site.siteName}</strong>
              <small>{site.siteUrl}</small>
            </div>
          ))}
        </div>
      )}

      <div className="hub-settings-v2-integration-facts">
        <label className="hub-settings-field">
          <span>Client link</span>
          <select
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value);
              setProjectId("");
            }}
          >
            <option value="">Unassigned</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </label>

        <label className="hub-settings-field">
          <span>Project link</span>
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            disabled={!clientId || projects.length === 0}
          >
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="hub-settings-v2-integration-actions-row">
        <button
          type="button"
          className="hub-secondary-button"
          onClick={createPairingCode}
          disabled={state.kind === "loading"}
        >
          <RefreshCw size={14} className={state.kind === "loading" ? "is-spinning" : undefined} />
          {state.kind === "loading" ? "Creating…" : "Generate pairing code"}
        </button>

        {state.kind === "success" && (
          <button type="button" className="hub-secondary-button" onClick={copyCode}>
            <Copy size={14} />{copied ? "Copied" : "Copy code"}
          </button>
        )}
      </div>

      {state.kind === "success" && (
        <div className="hub-settings-v2-integration-facts" style={{ marginTop: 12 }}>
          <div>
            <span>PAIRING CODE</span>
            <strong style={{ letterSpacing: "0.08em" }}>{state.code}</strong>
          </div>
          <div>
            <span>Use in WordPress</span>
            <strong>Staark Hub → Connect</strong>
          </div>
        </div>
      )}

      {state.kind === "success" && (
        <span className="hub-settings-v2-action-feedback is-success">
          <CheckCircle2 size={13} />{state.message}
        </span>
      )}
      {state.kind === "error" && (
        <span className="hub-settings-v2-action-feedback is-error">
          <XCircle size={13} />{state.message}
        </span>
      )}
    </article>
  );
}
