"use client";

import { CheckCircle2, RefreshCw, TestTube2, XCircle } from "lucide-react";
import { useState } from "react";

type ActionState =
  | { kind: "idle"; message: "" }
  | { kind: "loading"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type StripeEnvironment = "live" | "test";

type StripeAccount = {
  id: string | null;
  name: string | null;
  email: string | null;
  country: string | null;
  defaultCurrency: string | null;
  mode: "live" | "test" | "unknown";
  environment?: StripeEnvironment;
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

const INITIAL_STATE: Record<StripeEnvironment, ActionState> = {
  live: { kind: "idle", message: "" },
  test: { kind: "idle", message: "" },
};

const INITIAL_ACCOUNTS: Record<StripeEnvironment, StripeAccount | null> = {
  live: null,
  test: null,
};

export function StripeTestButton() {
  const [states, setStates] = useState<Record<StripeEnvironment, ActionState>>(INITIAL_STATE);
  const [accounts, setAccounts] = useState<Record<StripeEnvironment, StripeAccount | null>>(
    INITIAL_ACCOUNTS
  );

  async function testStripe(environment: StripeEnvironment) {
    setStates((current) => ({
      ...current,
      [environment]: {
        kind: "loading",
        message: environment === "live" ? "Testing Live…" : "Testing Sandbox…",
      },
    }));

    setAccounts((current) => ({ ...current, [environment]: null }));

    try {
      const response = await fetch("/api/hub/integrations/stripe/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ environment }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Stripe connection failed.");
      }

      const stripeAccount = (data?.account ?? null) as StripeAccount | null;

      setAccounts((current) => ({
        ...current,
        [environment]: stripeAccount,
      }));

      const label = stripeAccount?.name || stripeAccount?.id || "Stripe account";
      setStates((current) => ({
        ...current,
        [environment]: {
          kind: "success",
          message: `${label} · ${environment === "live" ? "Live" : "Sandbox"}`,
        },
      }));
    } catch (error) {
      setStates((current) => ({
        ...current,
        [environment]: {
          kind: "error",
          message: error instanceof Error ? error.message : "Stripe connection failed.",
        },
      }));
    }
  }

  return (
    <div className="hub-settings-v2-action-stack" style={{ width: "100%" }}>
      <div className="hub-settings-v2-integration-actions-row">
        {(["live", "test"] as const).map((environment) => {
          const state = states[environment];
          return (
            <div className="hub-settings-v2-action-stack" key={environment}>
              <button
                type="button"
                className="hub-secondary-button"
                onClick={() => testStripe(environment)}
                disabled={state.kind === "loading"}
              >
                <TestTube2 size={14} />
                {state.kind === "loading"
                  ? environment === "live"
                    ? "Testing Live…"
                    : "Testing Sandbox…"
                  : environment === "live"
                    ? "Test Live"
                    : "Test Sandbox"}
              </button>
              <ActionFeedback state={state} />
            </div>
          );
        })}
      </div>

      {(["live", "test"] as const).map((environment) => {
        const account = accounts[environment];
        if (!account) return null;

        return (
          <div key={environment} style={{ width: "100%", marginTop: 6 }}>
            <div className="hub-settings-v2-kicker">
              STRIPE {environment === "live" ? "LIVE" : "SANDBOX"}
            </div>
            <div className="hub-settings-v2-integration-facts">
              <div>
                <span>Status</span>
                <strong className="is-good">Connected</strong>
              </div>
              <div>
                <span>Mode</span>
                <strong>{environment === "live" ? "Live" : "Test"}</strong>
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
          </div>
        );
      })}
    </div>
  );
}
