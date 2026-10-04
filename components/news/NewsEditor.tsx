"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  ImagePlus,
  Upload,
  Eye,
  Pencil,
  Save,
} from "lucide-react";
import NewsMarkdown from "./NewsMarkdown";
import { NEWS_KINDS, NEWS_LIMITS, safeNewsUrl } from "@/lib/news-policy";
export type NewsEditorValue = {
  id?: string;
  title: string;
  summary: string;
  body: string;
  kind: string;
  audiencePlan: string;
  bodyFormat: string;
  ctaLabel: string;
  ctaUrl: string;
  coverImageUrl: string;
  pinned: boolean;
  published: boolean;
  updatedAt?: string;
};
const EMPTY: NewsEditorValue = {
  title: "",
  summary: "",
  body: "",
  kind: "feature",
  audiencePlan: "",
  bodyFormat: "markdown",
  ctaLabel: "",
  ctaUrl: "",
  coverImageUrl: "",
  pinned: false,
  published: false,
};
export default function NewsEditor({ initial }: { initial?: NewsEditorValue }) {
  const router = useRouter();
  const uid = useId();
  const [value, setValue] = useState(initial ?? EMPTY);
  const [saved, setSaved] = useState(JSON.stringify(initial ?? EMPTY));
  const [mode, setMode] = useState<"write" | "preview" | "split">("split");
  const [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  const [insert, setInsert] = useState<"link" | "image" | null>(null),
    [url, setUrl] = useState(""),
    [label, setLabel] = useState("");
  const [uploadTarget, setUploadTarget] = useState<"body" | "cover">("body");
  const textarea = useRef<HTMLTextAreaElement>(null),
    fileInput = useRef<HTMLInputElement>(null);
  const selection = useRef({ start: 0, end: 0 });
  const dirty = JSON.stringify(value) !== saved;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function field<K extends keyof NewsEditorValue>(
    key: K,
    next: NewsEditorValue[K],
  ) {
    setValue((current) => ({ ...current, [key]: next }));
  }
  function rememberSelection() {
    if (textarea.current)
      selection.current = {
        start: textarea.current.selectionStart,
        end: textarea.current.selectionEnd,
      };
  }
  function add(
    prefix: string,
    suffix = "",
    placeholder = "text",
    replaceSelection = false,
  ) {
    const { start, end } = selection.current;
    const selected = replaceSelection
      ? placeholder
      : value.body.slice(start, end) || placeholder;
    const fragment = prefix + selected + suffix;
    if (
      value.body.length - (end - start) + fragment.length >
      NEWS_LIMITS.body
    ) {
      setError("The update is too long.");
      return;
    }
    field(
      "body",
      value.body.slice(0, start) + fragment + value.body.slice(end),
    );
    field("bodyFormat", "markdown");
    setMode((current) => (current === "preview" ? "write" : current));
    requestAnimationFrame(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length,
      );
      rememberSelection();
    });
  }
  function openInsert(kind: "link" | "image") {
    rememberSelection();
    setLabel(value.body.slice(selection.current.start, selection.current.end));
    setUrl("");
    setInsert(kind);
  }
  const markdownText = (text: string) => text.replace(/[\\[\]]/g, "\\$&");
  function insertUrl() {
    const clean = safeNewsUrl(url, insert === "image");
    if (!clean || (insert === "image" && clean.startsWith("/"))) {
      setError("Use a full HTTP(S) image URL or a valid link destination.");
      return;
    }
    add(
      `${insert === "image" ? "!" : ""}[`,
      `](<${clean.replace(/>/g, "%3E").replace(/</g, "%3C")}>)`,
      markdownText(
        label || (insert === "image" ? "Image description" : "Read more"),
      ),
      true,
    );
    setInsert(null);
    setError("");
  }
  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image up to 5 MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/hub/updates/images", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string")
        throw new Error(data.error || "Upload failed.");
      if (uploadTarget === "cover") field("coverImageUrl", data.url);
      else
        add(
          "![",
          `](<${data.url}>)`,
          markdownText(file.name.replace(/\.[^.]+$/, "")),
        );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uploading) return;
    if (!value.body.trim()) {
      setError("Full update is required.");
      setMode("write");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      form.set("pinned", String(value.pinned));
      const response = await fetch("/api/hub/updates", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed.");
      const next = { ...value, id: data.id, updatedAt: data.updatedAt };
      setValue((current) => ({
        ...current,
        id: next.id,
        updatedAt: next.updatedAt,
      }));
      setSaved(JSON.stringify(next));
      if (!value.id) router.replace(`/hub/updates/${data.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  const tools = [
    { label: "Bold", Icon: Bold, prefix: "**", suffix: "**" },
    { label: "Italic", Icon: Italic, prefix: "*", suffix: "*" },
    { label: "Heading", Icon: Heading2, prefix: "\n## " },
    { label: "Bullet list", Icon: List, prefix: "\n- " },
    { label: "Numbered list", Icon: ListOrdered, prefix: "\n1. " },
    { label: "Quote", Icon: Quote, prefix: "\n> " },
    { label: "Code", Icon: Code, prefix: "`", suffix: "`" },
  ];
  return (
    <form className="hub-updates-form news-editor" onSubmit={save}>
      <input type="hidden" name="action" value="save" />
      <input type="hidden" name="id" value={value.id ?? ""} />
      <input type="hidden" name="updatedAt" value={value.updatedAt ?? ""} />
      <input type="hidden" name="bodyFormat" value={value.bodyFormat} />
      <header className="news-editor-head">
        <div>
          <span className="hub-workspace-kicker">PLATFORM / COMMUNICATION</span>
          <h1>{value.id ? "Edit update" : "Create an update"}</h1>
          <p>
            {value.published
              ? "Saving changes updates the published announcement."
              : "Start with a draft. Review it before publishing."}
          </p>
        </div>
        <div className="news-editor-controls">
          <Link
            href="/hub/updates"
            onClick={(event) => {
              if (
                dirty &&
                !window.confirm("Leave without saving your changes?")
              )
                event.preventDefault();
            }}
          >
            Back to updates
          </Link>
          <button
            className="hub-updates-primary-button"
            disabled={busy || uploading}
          >
            <Save size={15} />
            {busy ? "Saving…" : value.id ? "Save changes" : "Save draft"}
          </button>
        </div>
      </header>
      {error && (
        <div
          role="alert"
          className="hub-updates-notice hub-updates-notice-error"
        >
          {error}
        </div>
      )}
      <fieldset disabled={busy || uploading} className="news-editor-fields">
        <div className="news-editor-layout">
          <section className="news-editor-main">
            <label>
              <span>Title</span>
              <input
                name="title"
                required
                maxLength={NEWS_LIMITS.title}
                value={value.title}
                onChange={(e) => field("title", e.target.value)}
                placeholder="What’s new at Staark?"
              />
            </label>
            <label>
              <span>Short summary</span>
              <input
                name="summary"
                required
                maxLength={NEWS_LIMITS.summary}
                value={value.summary}
                onChange={(e) => field("summary", e.target.value)}
                placeholder="One sentence explaining the benefit to your customer."
              />
            </label>
            <div className="news-editor-mode" aria-label="Editor view">
              {(["write", "preview", "split"] as const).map((tab) => (
                <button
                  type="button"
                  key={tab}
                  aria-pressed={mode === tab}
                  onClick={() => setMode(tab)}
                >
                  {tab === "preview" ? <Eye size={14} /> : <Pencil size={14} />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <span role="status">{dirty ? "Unsaved changes" : "Saved"}</span>
            </div>
            <div className="news-editor-toolbar" aria-label="Formatting tools">
              {tools.map(({ label: name, Icon, prefix, suffix }) => (
                <button
                  type="button"
                  key={name}
                  title={name}
                  aria-label={name}
                  onClick={() => {
                    rememberSelection();
                    add(prefix, suffix);
                  }}
                >
                  <Icon size={16} />
                </button>
              ))}
              <button
                type="button"
                title="Insert link"
                aria-label="Insert link"
                onClick={() => openInsert("link")}
              >
                <Link2 size={16} />
              </button>
              <button
                type="button"
                title="Insert image URL"
                aria-label="Insert image URL"
                onClick={() => openInsert("image")}
              >
                <ImagePlus size={16} />
              </button>
              <button
                type="button"
                disabled={uploading || busy}
                onClick={() => {
                  rememberSelection();
                  setUploadTarget("body");
                  fileInput.current?.click();
                }}
              >
                <Upload size={14} />
                {uploading ? "Uploading…" : "Upload image"}
              </button>
            </div>
            {insert && (
              <fieldset className="news-insert">
                <legend>
                  {insert === "image" ? "Insert image" : "Insert link"}
                </legend>
                <label>
                  <span>
                    {insert === "image"
                      ? "Image description (alt text)"
                      : "Link text"}
                  </span>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </label>
                <label>
                  <span>Destination</span>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </label>
                <button type="button" onClick={insertUrl}>
                  Insert
                </button>
                <button type="button" onClick={() => setInsert(null)}>
                  Cancel
                </button>
              </fieldset>
            )}
            <div className={`news-editor-content news-editor-content-${mode}`}>
              <div className="news-editor-source" hidden={mode === "preview"}>
                <label
                  htmlFor={`${uid}-body`}
                  className="news-editor-body-label"
                >
                  Full update
                </label>
                <textarea
                  ref={textarea}
                  id={`${uid}-body`}
                  name="body"
                  required={mode !== "preview"}
                  maxLength={NEWS_LIMITS.body}
                  rows={18}
                  value={value.body}
                  onSelect={rememberSelection}
                  onChange={(e) => field("body", e.target.value)}
                  placeholder="## What changed\n\nExplain the improvement and how to use it."
                />
              </div>
              {mode !== "write" && (
                <article
                  className="news-editor-preview"
                  aria-label="Customer preview"
                >
                  <small>CUSTOMER PREVIEW · {value.kind}</small>
                  {value.coverImageUrl &&
                    safeNewsUrl(value.coverImageUrl, true) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="news-cover"
                        src={value.coverImageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                    )}
                  <h2>{value.title || "Your update title"}</h2>
                  <p className="news-preview-summary">
                    {value.summary || "Your short summary appears here."}
                  </p>
                  <NewsMarkdown
                    body={value.body || "Your update will appear here."}
                    format={value.bodyFormat}
                  />
                  {value.ctaLabel && safeNewsUrl(value.ctaUrl) && (
                    <a
                      className="news-cta"
                      href={safeNewsUrl(value.ctaUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {value.ctaLabel} ↗
                    </a>
                  )}
                </article>
              )}
            </div>
            <small>
              {value.body.length.toLocaleString()} /{" "}
              {NEWS_LIMITS.body.toLocaleString()} characters · Markdown supports
              lists, tables, links and images.
            </small>
            {value.bodyFormat === "plain" && (
              <button
                type="button"
                onClick={() => field("bodyFormat", "markdown")}
              >
                Enable Markdown for this existing update
              </button>
            )}
          </section>
          <aside className="news-editor-sidebar">
            <h2>Publication</h2>
            <label>
              <span>Type</span>
              <select
                name="kind"
                value={value.kind}
                onChange={(e) => field("kind", e.target.value)}
              >
                {NEWS_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind.charAt(0).toUpperCase() + kind.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Audience</span>
              <select
                name="audiencePlan"
                value={value.audiencePlan}
                onChange={(e) => field("audiencePlan", e.target.value)}
              >
                <option value="">All plans</option>
                <option value="STARTER">Starter</option>
                <option value="SAAS">Growth</option>
                <option value="BUSINESS">Business</option>
              </select>
            </label>
            <label className="news-checkbox">
              <input
                type="checkbox"
                checked={value.pinned}
                onChange={(e) => field("pinned", e.target.checked)}
              />
              <span>Pin at the top of the feed</span>
            </label>
            <h2>Cover image</h2>
            <label>
              <span>Full image URL</span>
              <input
                type="url"
                name="coverImageUrl"
                value={value.coverImageUrl}
                onChange={(e) => field("coverImageUrl", e.target.value)}
                placeholder="https://…"
              />
            </label>
            <button
              type="button"
              disabled={uploading || busy}
              onClick={() => {
                setUploadTarget("cover");
                fileInput.current?.click();
              }}
            >
              Upload cover
            </button>
            <h2>Action button</h2>
            <label>
              <span>Button text</span>
              <input
                name="ctaLabel"
                maxLength={NEWS_LIMITS.ctaLabel}
                value={value.ctaLabel}
                onChange={(e) => field("ctaLabel", e.target.value)}
                placeholder="Explore analytics"
              />
            </label>
            <label>
              <span>Destination</span>
              <input
                name="ctaUrl"
                maxLength={NEWS_LIMITS.url}
                value={value.ctaUrl}
                onChange={(e) => field("ctaUrl", e.target.value)}
                placeholder="/admin/analytics or https://…"
              />
            </label>
            <p>
              Relative links open inside the customer’s admin. Use a full URL
              for guides and external pages.
            </p>
          </aside>
        </div>
      </fieldset>
      <input
        ref={fileInput}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </form>
  );
}
