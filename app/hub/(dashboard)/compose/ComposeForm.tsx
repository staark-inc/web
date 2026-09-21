"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { CheckCircle2, Paperclip, Send, X } from "lucide-react";

import { formatFileSize } from "../thread/[id]/ReplyForm";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 15 * 1024 * 1024;

type ComposeFormProps = {
  initialTo?: string;
  initialSubject?: string;
  initialMessage?: string;
  returnTo?: string;
  confirmRecipient?: boolean;
  offerId?: string;
};

export default function ComposeForm({
  initialTo = "",
  initialSubject = "",
  initialMessage = "",
  returnTo,
  confirmRecipient = false,
  offerId,
}: ComposeFormProps) {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(selected: File[]) {
    const merged = [...files];

    for (const file of selected) {
      if (merged.some((existing) =>
        existing.name === file.name &&
        existing.size === file.size
      )) {
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" is larger than ${formatFileSize(MAX_FILE_SIZE)}.`);
        continue;
      }

      if (merged.length >= MAX_FILES) {
        setError(`You can attach up to ${MAX_FILES} files.`);
        break;
      }

      const total = merged.reduce((sum, item) => sum + item.size, 0);
      if (total + file.size > MAX_TOTAL_SIZE) {
        setError(`Attachments cannot exceed ${formatFileSize(MAX_TOTAL_SIZE)} in total.`);
        break;
      }

      merged.push(file);
    }

    setFiles(merged);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, position) => position !== index));
    setError("");
  }

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
      formData.delete("attachments");

      for (const file of files) {
        formData.append("attachments", file);
      }

      const response = await fetch("/api/hub/send", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Could not send the message."
        );
      }

      if (offerId) {
        const sharedResponse = await fetch(
          `/api/hub/offers/${encodeURIComponent(offerId)}/shared`,
          {
            method: "POST",
          }
        );

        const sharedData =
          await sharedResponse.json().catch(() => null);

        if (!sharedResponse.ok) {
          throw new Error(
            sharedData?.error ||
              "Email was sent, but the offer status could not be updated."
          );
        }
      }

      setSuccess(true);

      if (!returnTo) {
        setTimeout(() => setSuccess(false), 4000);
      }

      const messageField =
        form.elements.namedItem("message");

      if (!returnTo && messageField instanceof HTMLTextAreaElement) {
        messageField.value = "";
      }

      setFiles([]);
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
          defaultValue={initialMessage}
          required
        />
      </div>

      {confirmRecipient && (
        <label className="hub-offer-recipient-confirm">
          <input type="checkbox" required disabled={sending} />
          I checked the recipient address and want to send this offer by email.
        </label>
      )}

      {files.length > 0 && (
        <ul className="hub-file-list">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`}>
              <Paperclip size={14} aria-hidden="true" />

              <span className="hub-file-list-name">
                {file.name}
              </span>

              <span className="hub-file-list-size">
                {formatFileSize(file.size)}
              </span>

              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={sending}
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="hub-file-input-inline">
        <label htmlFor="hub-attachments" className="hub-file-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Attachments
          {files.length > 0 && ` (${files.length})`}
        </label>
        <input
          id="hub-attachments"
          ref={fileInputRef}
          type="file"
          multiple
          disabled={sending}
          onChange={(event) =>
            addFiles(Array.from(event.target.files ?? []))
          }
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
          {returnTo && (
            <Link href={returnTo} className="hub-offer-return-link">
              Return to the offer
            </Link>
          )}
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
          disabled={sending || Boolean(returnTo && success)}
        >
          {sending ? "Sending..." : "Send message"}
          <Send size={17} />
        </button>
      </div>
    </form>
  );
}
