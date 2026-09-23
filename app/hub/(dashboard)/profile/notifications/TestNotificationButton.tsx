"use client";

import { BellRing, LoaderCircle } from "lucide-react";
import { useState } from "react";

export default function TestNotificationButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  async function sendTest() {
    if (loading) return;

    setLoading(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/hub/notifications", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hub-notification-test">
      <div>
        <strong>Test realtime notifications</strong>
        <span>
          Sends a notification to your own account so you can verify the live update path without creating fake CRM data.
        </span>
      </div>

      <div className="hub-notification-test-actions">
        {status === "sent" ? (
          <span className="hub-notification-test-status is-success">Sent — watch the bell</span>
        ) : status === "error" ? (
          <span className="hub-notification-test-status is-error">Could not send test</span>
        ) : null}

        <button
          type="button"
          className="hub-secondary-button"
          onClick={() => void sendTest()}
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle className="hub-notification-test-spinner" size={15} />
          ) : (
            <BellRing size={15} />
          )}
          {loading ? "Sending…" : "Send test notification"}
        </button>
      </div>
    </div>
  );
}
