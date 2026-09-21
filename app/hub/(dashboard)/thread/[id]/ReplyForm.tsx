"use client";

import { Paperclip, Send, X } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 15 * 1024 * 1024;

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

    /*
     * The input is only a picker here; `files` state is the
     * source of truth, so it is cleared to allow re-selecting
     * a file that was just removed.
     */
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

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return;
    }

    setSending(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.set("message", cleanMessage);
      formData.set("to", to);
      formData.set("subject", subject);
      formData.set("threadId", threadId);

      for (const file of files) {
        formData.append("attachments", file);
      }
      const response = await fetch("/api/hub/send", {
        method: "POST",
        body: formData,
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
      setFiles([]);
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
          name="message"
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
          <div className="hub-file-input-inline">
            <label htmlFor="hub-reply-attachments" className="hub-file-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Attachments
              {files.length > 0 && ` (${files.length})`}
            </label>
            <input
              id="hub-reply-attachments"
              ref={fileInputRef}
              type="file"
              multiple
              disabled={sending}
              onChange={(event) =>
                addFiles(Array.from(event.target.files ?? []))
              }
            />
          </div>

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