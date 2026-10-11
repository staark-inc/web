"use client";

import { RotateCcw, Save } from "lucide-react";
import { useMemo, useState } from "react";

type TemplateEditorProps = {
  template: {
    key: string;
    name: string;
    description: string;
    subject: string;
    body: string;
    active: boolean;
  };
  variables: string[];
  sampleValues: Record<string, string>;
};

function renderPreview(source: string, values: Record<string, string>) {
  return source.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (match, key: string) => values[key] ?? match
  );
}

export default function TemplateEditor({
  template,
  variables,
  sampleValues,
}: TemplateEditorProps) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [active, setActive] = useState(template.active);

  const previewSubject = useMemo(
    () => renderPreview(subject, sampleValues),
    [subject, sampleValues]
  );
  const previewBody = useMemo(
    () => renderPreview(body, sampleValues),
    [body, sampleValues]
  );

  return (
    <div className="hub-settings-v2-template-editor">
      <form
        action="/api/hub/settings/templates"
        method="post"
        className="hub-settings-v2-template-form"
      >
        <input type="hidden" name="key" value={template.key} />
        <input type="hidden" name="active" value="0" />

        <div className="hub-settings-v2-template-head">
          <div>
            <span className="hub-settings-v2-kicker">SYSTEM TEMPLATE</span>
            <h2>{template.name}</h2>
            <p>{template.description}</p>
          </div>

          <label className="hub-settings-v2-toggle">
            <input
              type="checkbox"
              name="active"
              value="1"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            <span aria-hidden="true" />
            <strong>{active ? "Active" : "Disabled"}</strong>
          </label>
        </div>

        <label className="hub-settings-field">
          <span>Subject</span>
          <input
            type="text"
            name="subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            required
            maxLength={300}
          />
        </label>

        <label className="hub-settings-field hub-settings-v2-template-body">
          <span>Message</span>
          <textarea
            name="body"
            rows={14}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            maxLength={20000}
          />
        </label>

        <div className="hub-settings-v2-variable-block">
          <span>Available variables</span>
          <div>
            {variables.map((variable) => (
              <code key={variable}>{`{{${variable}}}`}</code>
            ))}
          </div>
        </div>

        <div className="hub-settings-v2-editor-actions">
          <button
            type="submit"
            name="intent"
            value="reset"
            className="hub-secondary-button"
          >
            <RotateCcw size={14} />
            Reset default
          </button>

          <button
            type="submit"
            name="intent"
            value="save"
            className="hub-send-button"
          >
            Save template
            <Save size={15} />
          </button>
        </div>
      </form>

      <aside className="hub-settings-v2-preview">
        <div className="hub-settings-v2-preview-head">
          <span>LIVE PREVIEW</span>
          <strong>Email preview</strong>
        </div>

        <div className="hub-settings-v2-preview-email">
          <div className="hub-settings-v2-preview-brand">Staark Inc.</div>
          <div className="hub-settings-v2-preview-content">
            <small>SUBJECT</small>
            <h3>{previewSubject || "No subject"}</h3>
            <div className="hub-settings-v2-preview-body">
              {previewBody || "No message"}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
