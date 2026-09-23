"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  FileText,
  History,
  Mail,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { formatFileSize } from "../thread/[id]/ReplyForm";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 15 * 1024 * 1024;
const DRAFT_KEY = "staark-hub-compose-draft-v2";

type Recipient = {
  id: string;
  name: string;
  email: string;
  company: string;
  kind: "Client" | "Lead" | "Contact";
  leadService: string;
  leadMessage: string;
  lastThreadId: string;
  lastThreadSubject: string;
  lastThreadAt: string;
};

type TemplateOption = {
  key: string;
  name: string;
  description: string;
  subject: string;
  body: string;
};

type ComposeFormProps = {
  initialTo?: string;
  initialSubject?: string;
  initialMessage?: string;
  returnTo?: string;
  confirmRecipient?: boolean;
  offerId?: string;
  recipients?: Recipient[];
  templates?: TemplateOption[];
  senderName?: string;
  senderEmail?: string;
  signature?: string;
};

type DraftState = {
  to: string;
  subject: string;
  message: string;
  templateKey: string;
};

function renderVariables(
  source: string,
  values: Record<string, string>
) {
  return source.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (match, key: string) => values[key] || match
  );
}

function findUnresolved(source: string) {
  return Array.from(
    new Set(
      Array.from(source.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map(
        (match) => match[1]
      )
    )
  );
}

function formatRecentDate(value: string) {
  if (!value) return "No previous conversation";

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function ComposeForm({
  initialTo = "",
  initialSubject = "",
  initialMessage = "",
  returnTo,
  confirmRecipient = false,
  offerId,
  recipients = [],
  templates = [],
  senderName = "Staark Inc.",
  senderEmail = "contact@staarkinc.com",
  signature = "",
}: ComposeFormProps) {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState(initialMessage);
  const [templateKey, setTemplateKey] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRecipient = useMemo(
    () =>
      recipients.find(
        (recipient) => recipient.email.toLowerCase() === to.trim().toLowerCase()
      ) ?? null,
    [recipients, to]
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === templateKey) ?? null,
    [templateKey, templates]
  );

  const unresolvedVariables = useMemo(
    () => findUnresolved(`${subject}\n${message}`),
    [subject, message]
  );

  useEffect(() => {
    if (initialTo || initialSubject || initialMessage || returnTo) {
      setDraftLoaded(true);
      return;
    }

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<DraftState>;
        if (typeof draft.to === "string") setTo(draft.to);
        if (typeof draft.subject === "string") setSubject(draft.subject);
        if (typeof draft.message === "string") setMessage(draft.message);
        if (typeof draft.templateKey === "string") setTemplateKey(draft.templateKey);
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      setDraftLoaded(true);
    }
  }, [initialMessage, initialSubject, initialTo, returnTo]);

  useEffect(() => {
    if (!draftLoaded || returnTo) return;

    const draft: DraftState = {
      to,
      subject,
      message,
      templateKey,
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draftLoaded, message, returnTo, subject, templateKey, to]);

  function getTemplateValues() {
    return {
      clientName: selectedRecipient?.name ?? "",
      companyName: selectedRecipient?.company ?? "",
      leadService: selectedRecipient?.leadService ?? "",
      leadMessage: selectedRecipient?.leadMessage ?? "",
      senderName,
    };
  }

  function applyTemplate() {
    if (!selectedTemplate) return;

    const values = getTemplateValues();
    setSubject(renderVariables(selectedTemplate.subject, values));
    setMessage(renderVariables(selectedTemplate.body, values));
    setError("");
  }

  function clearDraft() {
    setTo(initialTo);
    setSubject(initialSubject);
    setMessage(initialMessage);
    setTemplateKey("");
    setFiles([]);
    setError("");
    setSuccess(false);
    localStorage.removeItem(DRAFT_KEY);
  }

  function addFiles(selected: File[]) {
    const merged = [...files];

    for (const file of selected) {
      if (
        merged.some(
          (existing) => existing.name === file.name && existing.size === file.size
        )
      ) {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sending) return;

    if (unresolvedVariables.length > 0) {
      setError(
        `Replace the remaining template variables before sending: ${unresolvedVariables
          .map((variable) => `{{${variable}}}`)
          .join(", ")}.`
      );
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    setSending(true);
    setSuccess(false);
    setError("");

    try {
      formData.set("to", to.trim());
      formData.set("subject", subject.trim());
      formData.set("message", message.trim());
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
        throw new Error(data?.error || "Could not send the message.");
      }

      if (offerId) {
        const sharedResponse = await fetch(
          `/api/hub/offers/${encodeURIComponent(offerId)}/shared`,
          { method: "POST" }
        );

        const sharedData = await sharedResponse.json().catch(() => null);

        if (!sharedResponse.ok) {
          throw new Error(
            sharedData?.error ||
              "Email was sent, but the offer status could not be updated."
          );
        }
      }

      setSuccess(true);
      setFiles([]);

      if (!returnTo) {
        localStorage.removeItem(DRAFT_KEY);
        setSubject("");
        setMessage("");
        setTemplateKey("");
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      console.error("Hub compose error:", err);
      setError(err instanceof Error ? err.message : "Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="hub-mail-compose-grid" onSubmit={handleSubmit}>
      <section className="hub-mail-compose-editor">
        <div className="hub-mail-compose-toolbar">
          <div>
            <span className="hub-mail-v2-kicker">MESSAGE</span>
            <strong>Compose email</strong>
          </div>

          <button type="button" className="hub-mail-v2-ghost" onClick={clearDraft}>
            <RotateCcw size={14} />
            Discard draft
          </button>
        </div>

        <div className="hub-mail-recipient-row">
          <label htmlFor="hub-to">To</label>
          <div className="hub-mail-input-wrap">
            <Mail size={16} />
            <input
              id="hub-to"
              name="to"
              type="email"
              list="hub-recipient-options"
              placeholder="Search a contact or enter an email"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              autoComplete="off"
              required
            />
            <datalist id="hub-recipient-options">
              {recipients.map((recipient) => (
                <option
                  key={recipient.id}
                  value={recipient.email}
                  label={`${recipient.name}${recipient.company ? ` · ${recipient.company}` : ""}`}
                />
              ))}
            </datalist>
          </div>
        </div>

        <div className="hub-mail-recipient-row">
          <label htmlFor="hub-subject">Subject</label>
          <input
            id="hub-subject"
            name="subject"
            type="text"
            placeholder="What is this message about?"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={300}
            required
          />
        </div>

        <div className="hub-mail-template-strip">
          <div>
            <Sparkles size={15} />
            <span>Template</span>
          </div>

          <select
            value={templateKey}
            onChange={(event) => setTemplateKey(event.target.value)}
            aria-label="Email template"
          >
            <option value="">Blank message</option>
            {templates.map((template) => (
              <option key={template.key} value={template.key}>
                {template.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="hub-mail-v2-ghost"
            onClick={applyTemplate}
            disabled={!selectedTemplate}
          >
            <FileText size={14} />
            Apply
          </button>
        </div>

        {selectedTemplate && (
          <div className="hub-mail-template-note">{selectedTemplate.description}</div>
        )}

        <div className="hub-mail-message-field">
          <textarea
            id="hub-message"
            name="message"
            rows={16}
            placeholder="Write your message..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={20000}
            required
          />
        </div>

        {confirmRecipient && (
          <label className="hub-offer-recipient-confirm">
            <input type="checkbox" required disabled={sending} />
            I checked the recipient address and want to send this offer by email.
          </label>
        )}

        <div
          className={`hub-mail-dropzone ${dragging ? "is-dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(Array.from(event.dataTransfer.files ?? []));
          }}
        >
          <Paperclip size={17} />
          <div>
            <strong>Drop attachments here</strong>
            <span>Up to 5 files · 5 MB each · 15 MB total</span>
          </div>
          <label htmlFor="hub-attachments">Choose files</label>
          <input
            id="hub-attachments"
            ref={fileInputRef}
            type="file"
            multiple
            disabled={sending}
            onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
          />
        </div>

        {files.length > 0 && (
          <ul className="hub-mail-file-list">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                <Paperclip size={14} />
                <span>{file.name}</span>
                <small>{formatFileSize(file.size)}</small>
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

        {error && <div className="hub-compose-error">{error}</div>}

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

        <div className="hub-mail-compose-actions">
          <button
            type="button"
            className="hub-secondary-button"
            onClick={() => setShowPreview((value) => !value)}
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>

          <button
            className="hub-send-button"
            type="submit"
            disabled={
              sending ||
              Boolean(returnTo && success) ||
              !to.trim() ||
              !subject.trim() ||
              !message.trim()
            }
          >
            {sending ? "Sending..." : "Send message"}
            <Send size={17} />
          </button>
        </div>
      </section>

      <aside className="hub-mail-compose-side">
        <section className="hub-mail-context-card">
          <div className="hub-mail-side-heading">
            <span className="hub-mail-v2-kicker">RECIPIENT</span>
            <strong>Contact context</strong>
          </div>

          {selectedRecipient ? (
            <>
              <div className="hub-mail-contact-identity">
                <div>{selectedRecipient.name.charAt(0).toUpperCase()}</div>
                <div>
                  <strong>{selectedRecipient.name}</strong>
                  <span>{selectedRecipient.email}</span>
                </div>
                <small>{selectedRecipient.kind}</small>
              </div>

              <dl className="hub-mail-contact-facts">
                <div>
                  <dt>Company</dt>
                  <dd>{selectedRecipient.company || "Not set"}</dd>
                </div>
                <div>
                  <dt>Last conversation</dt>
                  <dd>{formatRecentDate(selectedRecipient.lastThreadAt)}</dd>
                </div>
              </dl>

              {selectedRecipient.lastThreadId && (
                <Link
                  href={`/hub/thread/${selectedRecipient.lastThreadId}`}
                  className="hub-mail-history-link"
                >
                  <History size={14} />
                  <span>
                    <strong>{selectedRecipient.lastThreadSubject || "Previous conversation"}</strong>
                    Open conversation history
                  </span>
                </Link>
              )}
            </>
          ) : (
            <div className="hub-mail-side-empty">
              <UserRound size={20} />
              <strong>No contact selected</strong>
              <span>Choose an existing contact email to see CRM context here.</span>
            </div>
          )}
        </section>

        {showPreview && (
          <section className="hub-mail-preview-card">
            <div className="hub-mail-side-heading">
              <span className="hub-mail-v2-kicker">PREVIEW</span>
              <strong>Outgoing email</strong>
            </div>

            <div className="hub-mail-preview-envelope">
              <div className="hub-mail-preview-brand">{senderName}</div>
              <div className="hub-mail-preview-meta">
                <span>From</span>
                <strong>{senderEmail}</strong>
                <span>To</span>
                <strong>{to || "recipient@company.se"}</strong>
              </div>
              <div className="hub-mail-preview-content">
                <small>SUBJECT</small>
                <h3>{subject || "No subject yet"}</h3>
                <p>{message || "Your message preview will appear here."}</p>
                {signature && <div className="hub-mail-preview-signature">{signature}</div>}
              </div>
            </div>

            {unresolvedVariables.length > 0 && (
              <div className="hub-mail-variable-warning">
                Replace {unresolvedVariables.length} template variable
                {unresolvedVariables.length === 1 ? "" : "s"} before sending.
              </div>
            )}
          </section>
        )}
      </aside>
    </form>
  );
}
