"use client";

import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ReplyFormProps = {
  threadId: string;
  to: string;
  subject: string;
};

export default function ReplyForm({
  threadId,
  to,
  subject,
}: ReplyFormProps) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return;
    }

    setSending(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/hub/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          message: cleanMessage,
          threadId,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || "Could not send reply."
        );
      }

      setMessage("");
      setSuccess(true);

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not send reply."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="hub-thread-reply">
      <div className="hub-thread-reply-header">
        <div>
          <span>REPLY</span>

          <strong>{to}</strong>
        </div>

        <span className="hub-thread-reply-subject">
          {subject}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Write your reply..."
          rows={7}
          maxLength={20000}
          disabled={sending}
          required
        />

        {error && (
          <div className="hub-compose-error hub-thread-reply-status">
            {error}
          </div>
        )}

        {success && (
          <div className="hub-compose-success hub-thread-reply-status">
            Message sent successfully.
          </div>
        )}

        <div className="hub-thread-reply-footer">
          <span>
            Replying in this conversation
          </span>

          <button
            type="submit"
            className="hub-send-button"
            disabled={
              sending ||
              !message.trim()
            }
          >
            {sending
              ? "Sending..."
              : "Send reply"}

            <Send size={15} />
          </button>
        </div>
      </form>
    </section>
  );
}