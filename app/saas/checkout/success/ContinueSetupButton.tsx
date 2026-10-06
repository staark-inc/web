"use client";

import { useState } from "react";

export default function ContinueSetupButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function continueSetup() {
    setLoading(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/saas/setup/claim-token",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              sessionId,
            }),
          },
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.token
      ) {
        throw new Error(
          data?.error ||
            "Kunde inte starta installationen.",
        );
      }

      const url =
        new URL(
          "/saas/setup",
          window.location.origin,
        );

      url.searchParams.set(
        "token",
        data.token,
      );

      window.location.assign(
        url.toString(),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Något gick fel.",
      );

      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="site-button site-button-primary"
        disabled={loading}
        onClick={continueSetup}
      >
        {loading
          ? "Förbereder webbplatsen…"
          : "Konfigurera webbplatsen"}
      </button>

      {error ? (
        <p
          style={{
            marginTop: 12,
            color:
              "var(--site-danger, #c33)",
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
