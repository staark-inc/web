"use client";

import { CheckCircle2, RefreshCw, TestTube2, XCircle } from "lucide-react";
import { useState } from "react";

type ActionState =
  | { kind: "idle"; message: "" }
  | { kind: "loading"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type StripeAccount = {
  id: string | null;
  name: string | null;
  email: string | null;
  country: string | null;
  defaultCurrency: string | null;
  mode: "live" | "test" | "unknown";
};

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
  const [account, setAccount] = useState<StripeAccount | null>(null);

  async function testStripe() {
    setState({ kind: "loading", message: "Testing Stripe…" });
    setAccount(null);

    try {
      const response = await fetch("/api/hub/integrations/stripe/test", {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Stripe connection failed.");
      }

      const stripeAccount = (data?.account ?? null) as StripeAccount | null;
      setAccount(stripeAccount);

      const label = stripeAccount?.name || stripeAccount?.id || "Stripe account";
      const mode =
        stripeAccount?.mode === "live"
          ? "Live"
          : stripeAccount?.mode === "test"
            ? "Test"
            : "Connected";

      setState({ kind: "success", message: `${label} · ${mode}` });
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

      {account && (
        <div className="hub-settings-v2-integration-facts" style={{ width: "100%", marginTop: 4 }}>
          <div>
            <span>Status</span>
            <strong className="is-good">Connected</strong>
          </div>
          <div>
            <span>Mode</span>
            <strong>
              {account.mode === "live"
                ? "Live"
                : account.mode === "test"
                  ? "Test"
                  : "Connected"}
            </strong>
          </div>
          <div>
            <span>Account</span>
            <strong>{account.name || account.email || "Stripe account"}</strong>
          </div>
          <div>
            <span>Account ID</span>
            <strong>{account.id || "Not available"}</strong>
          </div>
          <div>
            <span>Country</span>
            <strong>{account.country?.toUpperCase() || "Not available"}</strong>
          </div>
          <div>
            <span>Currency</span>
            <strong>{account.defaultCurrency || "SEK"}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
