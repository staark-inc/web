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
      const tokenResponse = await fetch(
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

      const tokenData =
        await tokenResponse.json();

      if (
        !tokenResponse.ok ||
        !tokenData?.token
      ) {
        throw new Error(
          tokenData?.error ||
            "Kunde inte starta installationen.",
        );
      }

      const claimResponse = await fetch(
        "/api/saas/setup/claim",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            token: tokenData.token,
          }),
        },
      );

      const claimData =
        await claimResponse.json();

      if (!claimResponse.ok) {
        throw new Error(
          claimData?.error ||
            "Kunde inte skapa webbplatsen.",
        );
      }

      if (
        claimData?.next?.setupCompleted
      ) {
        window.location.assign(
          claimData.next.siteUrl,
        );
        return;
      }

      if (!claimData?.setupUrl) {
        throw new Error(
          "Staark Next returnerade ingen setup-länk.",
        );
      }

      window.location.assign(
        claimData.setupUrl,
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
        className="v2-button v2-button-primary"
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
            color: "var(--v2-danger, #c33)",
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
