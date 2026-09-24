"use client";

import {
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  PlugZap,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";

type WordPressSite = {
  id: string;
  siteName: string;
  siteUrl: string;
  adminUrl: string | null;
  status: string;
  wordpressVersion: string | null;
  hubVersion: string | null;
  lastSeenAt: string | null;
};

type PairingState =
  | { kind: "idle"; message: ""; code: ""; expiresAt: "" }
  | { kind: "loading"; message: string; code: ""; expiresAt: "" }
  | { kind: "success"; message: string; code: string; expiresAt: string }
  | { kind: "error"; message: string; code: ""; expiresAt: "" };

function formatLastSeen(value: string | null) {
  if (!value) return "Never checked in";

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ProjectWordPressPanel({
  projectId,
  clientId,
  clientName,
  sites,
}: {
  projectId: string;
  clientId: string;
  clientName: string;
  sites: WordPressSite[];
}) {
  const [state, setState] = useState<PairingState>({
    kind: "idle",
    message: "",
    code: "",
    expiresAt: "",
  });
  const [copied, setCopied] = useState(false);

  async function generatePairingCode() {
    setCopied(false);
    setState({
      kind: "loading",
      message: "Creating project pairing code…",
      code: "",
      expiresAt: "",
    });

    try {
      const response = await fetch("/api/hub/integrations/wordpress/pairing-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, projectId }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.code || !data?.expiresAt) {
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
    <section className="hub-client-panel">
      <div className="hub-project-wordpress-head">
        <div>
          <h2>
            <PlugZap size={16} />
            WordPress connection
          </h2>
          <p className="hub-client-empty">
            Connect this project to Staark Hub for support sync and managed-site status.
          </p>
        </div>
        <span className={`hub-mode ${sites.length > 0 ? "" : "hub-mode-muted"}`}>
          {sites.length > 0 ? `${sites.length} connected` : "Not connected"}
        </span>
      </div>

      {sites.length > 0 ? (
        <div className="hub-project-wordpress-sites">
          {sites.map((site) => (
            <article key={site.id} className="hub-project-wordpress-site">
              <div className="hub-project-wordpress-site-main">
                <span className="hub-project-wordpress-status">
                  <CheckCircle2 size={14} /> {site.status}
                </span>
                <strong>{site.siteName}</strong>
                <a href={site.siteUrl} target="_blank" rel="noopener noreferrer">
                  {site.siteUrl} <ExternalLink size={12} />
                </a>
              </div>

              <div className="hub-project-wordpress-meta">
                <span>
                  <small>WordPress</small>
                  <strong>{site.wordpressVersion ?? "Unknown"}</strong>
                </span>
                <span>
                  <small>Staark Hub</small>
                  <strong>{site.hubVersion ?? "Unknown"}</strong>
                </span>
                <span>
                  <small>Last seen</small>
                  <strong>{formatLastSeen(site.lastSeenAt)}</strong>
                </span>
              </div>

              {site.adminUrl && (
                <a
                  href={site.adminUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hub-secondary-button"
                >
                  Open WordPress admin <ExternalLink size={13} />
                </a>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="hub-project-wordpress-empty">
          <KeyRound size={18} />
          <div>
            <strong>No WordPress site linked yet</strong>
            <p>
              Install and activate the Staark Hub plugin in WordPress, then paste a one-time pairing code under Staark Hub → Connect.
            </p>
          </div>
        </div>
      )}

      <div className="hub-project-wordpress-pairing">
        <div>
          <strong>Pair this project</strong>
          <p>
            The generated code is automatically linked to {clientName} and this project. It expires after 15 minutes.
          </p>
        </div>

        <div className="hub-project-wordpress-actions">
          <button
            type="button"
            className="hub-secondary-button"
            onClick={generatePairingCode}
            disabled={state.kind === "loading"}
          >
            <RefreshCw size={14} className={state.kind === "loading" ? "is-spinning" : undefined} />
            {state.kind === "loading" ? "Generating…" : "Generate pairing code"}
          </button>

          {state.kind === "success" && (
            <button type="button" className="hub-secondary-button" onClick={copyCode}>
              <Copy size={14} /> {copied ? "Copied" : "Copy code"}
            </button>
          )}
        </div>
      </div>

      {state.kind === "success" && (
        <div className="hub-project-wordpress-code">
          <span>PAIRING CODE</span>
          <strong>{state.code}</strong>
          <small>{state.message}</small>
        </div>
      )}

      {state.kind === "error" && (
        <p className="hub-settings-v2-action-feedback is-error">
          <XCircle size={13} /> {state.message}
        </p>
      )}
    </section>
  );
}
