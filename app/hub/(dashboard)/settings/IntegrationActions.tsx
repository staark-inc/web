"use client";

import { CheckCircle2, RefreshCw, TestTube2, XCircle } from "lucide-react";
import { useState } from "react";

type ActionState =
  | { kind: "idle"; message: "" }
  | { kind: "loading"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function ActionFeedback({ state }: { state: ActionState }) {
  if (state.kind === "idle" || state.kind === "loading") return null;

  return (
    <span
      className={
        state.kind === "success"
          ? "hub-settings-v2-action-feedback is-success"
          : "hub-settings-v2-action-feedback is-error"
      }
    >
      {state.kind === "success" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {state.message}
    </span>
  );
}

export function GmailWatchButton() {
  const [state, setState] = useState<ActionState>({ kind: "idle", message: "" });

  async function renewWatch() {
    setState({ kind: "loading", message: "Renewing watch…" });

    try {
      const response = await fetch("/api/google/gmail/watch", {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Could not renew Gmail watch.");
      }

      const expiry = data?.watchExpiresAt
        ? new Intl.DateTimeFormat("sv-SE", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(data.watchExpiresAt))
        : "updated";

      setState({ kind: "success", message: `Watch active until ${expiry}.` });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not renew Gmail watch.",
      });
    }
  }

  return (
    <div className="hub-settings-v2-action-stack">
      <button
        type="button"
        className="hub-secondary-button"
        onClick={renewWatch}
        disabled={state.kind === "loading"}
      >
        <RefreshCw size={14} className={state.kind === "loading" ? "is-spinning" : undefined} />
        {state.kind === "loading" ? "Renewing…" : "Renew Gmail watch"}
      </button>
      <ActionFeedback state={state} />
    </div>
  );
}

export function StripeTestButton() {
  const [state, setState] = useState<ActionState>({ kind: "idle", message: "" });

  async function testStripe() {
    setState({ kind: "loading", message: "Testing Stripe…" });

    try {
      const response = await fetch("/api/hub/integrations/stripe/test", {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Stripe connection failed.");
      }

      const label = data?.account?.name || data?.account?.id || "Stripe account";
      setState({ kind: "success", message: `${label} connected.` });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Stripe connection failed.",
      });
    }
  }

  return (
    <div className="hub-settings-v2-action-stack">
      <button
        type="button"
        className="hub-secondary-button"
        onClick={testStripe}
        disabled={state.kind === "loading"}
      >
        <TestTube2 size={14} />
        {state.kind === "loading" ? "Testing…" : "Test connection"}
      </button>
      <ActionFeedback state={state} />
    </div>
  );
}
