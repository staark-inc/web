"use client";

import {
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useState,
} from "react";

type Props = {
  subscriptionId: string;
  canRetryProvisioning: boolean;
};

type ActionState = {
  tone:
    | "success"
    | "error";
  message: string;
  setupUrl?: string;
} | null;

async function postAction(
  url: string,
  subscriptionId: string,
) {
  const response =
    await fetch(url, {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify({
          subscriptionId,
        }),
    });

  const data =
    await response
      .json()
      .catch(() => null) as
      | {
          ok?: boolean;
          error?: string;
          skipped?: boolean;
          reason?: string | null;
          setupUrl?: string;
        }
      | null;

  if (
    !response.ok ||
    !data?.ok
  ) {
    throw new Error(
      data?.error ||
        `Request failed with HTTP ${response.status}.`,
    );
  }

  return data;
}

export default function SubscriptionOpsActions({
  subscriptionId,
  canRetryProvisioning,
}: Props) {
  const router =
    useRouter();

  const [
    running,
    setRunning,
  ] =
    useState<
      "sync" |
      "retry" |
      null
    >(null);

  const [
    state,
    setState,
  ] =
    useState<ActionState>(
      null,
    );

  async function resync() {
    setRunning(
      "sync",
    );

    setState(
      null,
    );

    try {
      const result =
        await postAction(
          "/api/saas/subscription/resync-runtime",
          subscriptionId,
        );

      setState({
        tone:
          "success",

        message:
          result.skipped
            ? result.reason ||
              "Runtime sync was skipped."
            : "Runtime subscription synchronized.",
      });

      router.refresh();
    } catch (error) {
      setState({
        tone:
          "error",

        message:
          error instanceof Error
            ? error.message
            : "Runtime synchronization failed.",
      });
    } finally {
      setRunning(
        null,
      );
    }
  }

  async function retryProvisioning() {
    setRunning(
      "retry",
    );

    setState(
      null,
    );

    try {
      const result =
        await postAction(
          "/api/saas/provisioning/retry",
          subscriptionId,
        );

      setState({
        tone:
          "success",

        message:
          "Fresh setup link created.",

        setupUrl:
          result.setupUrl,
      });

      router.refresh();
    } catch (error) {
      setState({
        tone:
          "error",

        message:
          error instanceof Error
            ? error.message
            : "Provisioning retry failed.",
      });
    } finally {
      setRunning(
        null,
      );
    }
  }

  return (
    <div className="hub-saas-ops">
      <div className="hub-saas-ops__buttons">
        <button
          type="button"
          className="hub-secondary-button"
          disabled={running !== null}
          onClick={resync}
        >
          <RefreshCw
            size={14}
          />

          {running === "sync"
            ? "Syncing…"
            : "Resync runtime"}
        </button>

        {canRetryProvisioning ? (
          <button
            type="button"
            className="hub-secondary-button"
            disabled={running !== null}
            onClick={retryProvisioning}
          >
            <RotateCcw
              size={14}
            />

            {running === "retry"
              ? "Preparing…"
              : "Retry provisioning"}
          </button>
        ) : null}
      </div>

      {state ? (
        <div
          className={`hub-saas-ops__result hub-saas-ops__result-${state.tone}`}
        >
          <span>
            {state.message}
          </span>

          {state.setupUrl ? (
            <a
              href={state.setupUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open setup
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
