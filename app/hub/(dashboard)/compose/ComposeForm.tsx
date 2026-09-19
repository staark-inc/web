"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

type ComposeFormProps = {
  initialTo?: string;
  initialSubject?: string;
};

export default function ComposeForm({
  initialTo = "",
  initialSubject = "",
}: ComposeFormProps) {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (sending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const to = String(formData.get("to") ?? "").trim();
    const subject = String(
      formData.get("subject") ?? ""
    ).trim();
    const message = String(
      formData.get("message") ?? ""
    ).trim();

    setSending(true);
    setSuccess(false);
    setError("");

    try {
      const response = await fetch("/api/hub/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          message,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Could not send the message."
        );
      }

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 4000);

      const messageField =
        form.elements.namedItem("message");

      if (messageField instanceof HTMLTextAreaElement) {
        messageField.value = "";
      }
    } catch (err) {
      console.error("Hub compose error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not send the message."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      className="hub-compose-card"
      onSubmit={handleSubmit}
    >
      <div className="hub-compose-field">
        <label htmlFor="hub-to">To</label>

        <input
          id="hub-to"
          name="to"
          type="email"
          placeholder="customer@company.se"
          defaultValue={initialTo}
          required
        />
      </div>

      <div className="hub-compose-field">
        <label htmlFor="hub-subject">Subject</label>

        <input
          id="hub-subject"
          name="subject"
          type="text"
          placeholder="Subject..."
          defaultValue={initialSubject}
          required
        />
      </div>

      <div className="hub-compose-field hub-compose-message">
        <label htmlFor="hub-message">Message</label>

        <textarea
          id="hub-message"
          name="message"
          rows={12}
          placeholder="Write your message..."
          required
        />
      </div>

      {error && (
        <div className="hub-compose-error">
          {error}
        </div>
      )}

      {success && (
        <div className="hub-compose-success">
          <CheckCircle2 size={17} />
          Message sent successfully.
        </div>
      )}

      <div className="hub-compose-footer">
        <div>
          <span className="hub-template-label">
            EMAIL TEMPLATE
          </span>
          <strong>Staark Standard</strong>
        </div>

        <button
          className="hub-send-button"
          type="submit"
          disabled={sending}
        >
          {sending ? "Sending..." : "Send message"}
          <Send size={17} />
        </button>
      </div>
    </form>
  );
}