"use client";

import {
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  Trash2,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
} from "@/components/hub/ui";

import { PreviewDialog } from "../PreviewDialog";
import styles from "../preview.module.css";

type FormValues = {
  name: string;
  email: string;
  plan: string;
  owner: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: "",
  email: "",
  plan: "growth",
  owner: "alexandra",
  notes: "",
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "Enter a contact name.";
  if (!values.email.trim()) {
    errors.email = "Enter an email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (values.notes.length > 280) errors.notes = "Keep the note under 280 characters.";
  return errors;
}

export function FormsSection() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaved(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = nextErrors.name ? "form-name" : nextErrors.email ? "form-email" : "form-notes";
      requestAnimationFrame(() => document.getElementById(firstInvalid)?.focus());
      return;
    }
    setConfirmOpen(true);
  }

  function confirmSave() {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setConfirmOpen(false);
      setSaved(true);
    }, 450);
  }

  function reset() {
    setValues(initialValues);
    setErrors({});
    setSaved(false);
    setDiscardOpen(false);
  }

  return (
    <div className={styles.sectionStack}>
      <PageHeader
        className={styles.pageHeader}
        eyebrow="SYSTEM / FORM CONTRACT"
        title="Forms"
        description="Compact groups, clear validation and local confirmation. No oversized empty containers and no server action."
        action={<StatusBadge tone="info">Static form · local state</StatusBadge>}
      />

      <div className={styles.formLayout}>
        <Card padding="lg" className={styles.formCard}>
          <div className={styles.formHeading}>
            <div>
              <span className={styles.eyebrow}>NEW CLIENT INTAKE</span>
              <h2>Create a preview client</h2>
              <p>Complete the fields to inspect validation, pending and confirmation states.</p>
            </div>
            <span className={styles.formStep}>01 / 03</span>
          </div>

          {saved && (
            <div className={styles.successAlert} role="status">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>Preview client saved locally. Nothing was persisted or sent to a server.</span>
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <fieldset className={styles.formSection}>
              <legend>Contact</legend>
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${errors.name ? styles.fieldInvalid : ""}`}>
                  <span className={styles.fieldLabel}>Contact name</span>
                  <input
                    id="form-name"
                    className={styles.input}
                    value={values.name}
                    onChange={(event) => update("name", event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "form-name-error" : "form-name-hint"}
                    autoComplete="off"
                  />
                  <span id="form-name-hint" className={styles.fieldHint}>The primary person for this account.</span>
                  {errors.name && <span id="form-name-error" className={styles.errorText} role="alert">{errors.name}</span>}
                </label>

                <label className={`${styles.field} ${errors.email ? styles.fieldInvalid : ""}`}>
                  <span className={styles.fieldLabel}>Email</span>
                  <input
                    id="form-email"
                    className={styles.input}
                    type="email"
                    value={values.email}
                    onChange={(event) => update("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "form-email-error" : "form-email-hint"}
                    autoComplete="off"
                    placeholder="name@company.example"
                  />
                  <span id="form-email-hint" className={styles.fieldHint}>Used only to demonstrate validation.</span>
                  {errors.email && <span id="form-email-error" className={styles.errorText} role="alert">{errors.email}</span>}
                </label>
              </div>
            </fieldset>

            <fieldset className={styles.formSection}>
              <legend>Commercial context</legend>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Plan</span>
                  <select
                    className={styles.select}
                    value={values.plan}
                    onChange={(event) => update("plan", event.target.value)}
                  >
                    <option value="starter">Starter · SEK 24,000</option>
                    <option value="growth">Growth · SEK 64,000</option>
                    <option value="enterprise">Enterprise · custom</option>
                  </select>
                  <span className={styles.fieldHint}>Plan changes only affect the preview summary.</span>
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Owner</span>
                  <select
                    className={styles.select}
                    value={values.owner}
                    onChange={(event) => update("owner", event.target.value)}
                  >
                    <option value="alexandra">Alexandra</option>
                    <option value="mia">Mia</option>
                    <option value="jonas">Jonas</option>
                  </select>
                  <span className={styles.fieldHint}>Ownership stays local to this preview.</span>
                </label>
              </div>
            </fieldset>

            <fieldset className={styles.formSection}>
              <legend>Notes</legend>
              <label className={`${styles.field} ${errors.notes ? styles.fieldInvalid : ""}`}>
                <span className={styles.fieldLabel}>Internal note</span>
                <textarea
                  id="form-notes"
                  className={styles.textarea}
                  rows={4}
                  value={values.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby={errors.notes ? "form-notes-error" : "form-notes-hint"}
                  placeholder="Add context for the next person who opens this record."
                />
                <span id="form-notes-hint" className={styles.fieldHint}>
                  Optional · {values.notes.length}/280 characters
                </span>
                {errors.notes && <span id="form-notes-error" className={styles.errorText} role="alert">{errors.notes}</span>}
              </label>
            </fieldset>

            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setDiscardOpen(true)}>
                <Trash2 size={15} aria-hidden="true" />
                Discard draft
              </Button>
              <Button type="submit">Review & save</Button>
            </div>
          </form>
        </Card>

        <div className={styles.formSide}>
          <Card>
            <span className={styles.eyebrow}>FORM CONTRACT</span>
            <h2>One field system, every state.</h2>
            <ul className={styles.checkList}>
              <li><CheckCircle2 size={16} aria-hidden="true" /> Visible label, optional hint and inline error.</li>
              <li><CheckCircle2 size={16} aria-hidden="true" /> Invalid and described-by relationships are wired.</li>
              <li><CheckCircle2 size={16} aria-hidden="true" /> Destructive discard requires confirmation.</li>
              <li><CheckCircle2 size={16} aria-hidden="true" /> Pending state blocks repeat submission.</li>
              <li><CheckCircle2 size={16} aria-hidden="true" /> Success is announced with a live status region.</li>
            </ul>
          </Card>

          <Card variant="muted">
            <span className={styles.eyebrow}>PREVIEW ONLY</span>
            <h2>Nothing leaves the browser.</h2>
            <p className={styles.sideDescription}>
              This form deliberately has no Server Action, API request, Prisma query or external integration.
            </p>
            <div className={styles.inlineNote}><LockKeyhole size={16} aria-hidden="true" /> Local state only</div>
            <div className={styles.inlineNote}><ClipboardCheck size={16} aria-hidden="true" /> WCAG AA validation states</div>
          </Card>
        </div>
      </div>

      <PreviewDialog
        open={confirmOpen}
        onClose={() => {
          if (!saving) setConfirmOpen(false);
        }}
        title="Save preview client?"
        description="Review the local preview values before saving. This does not create a real client."
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmSave} disabled={saving} aria-busy={saving}>
              {saving ? "Saving…" : "Save preview"}
            </Button>
          </>
        }
      >
        <dl className={styles.reviewList}>
          <div><dt>Contact</dt><dd>{values.name}</dd></div>
          <div><dt>Email</dt><dd>{values.email}</dd></div>
          <div><dt>Plan</dt><dd>{values.plan}</dd></div>
          <div><dt>Owner</dt><dd>{values.owner}</dd></div>
          <div><dt>Note</dt><dd>{values.notes || "No note"}</dd></div>
        </dl>
      </PreviewDialog>

      <PreviewDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard this draft?"
        description="This clears the local form values. No production data is affected."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setDiscardOpen(false)}>
              Keep editing
            </Button>
            <Button type="button" variant="danger" onClick={reset}>
              Discard draft
            </Button>
          </>
        }
      >
        <p className={styles.dialogBodyCopy}>
          The preview fields will return to their initial state. This is a local destructive-action demonstration.
        </p>
      </PreviewDialog>
    </div>
  );
}
