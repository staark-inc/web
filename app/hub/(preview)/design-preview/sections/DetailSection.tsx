"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import {
  ActionLink,
  Button,
  Card,
  StatusBadge,
} from "@/components/hub/ui";

import { PreviewDialog } from "../PreviewDialog";
import { previewTimeline } from "../preview-data";
import type { PreviewSectionId } from "../preview-sections";
import styles from "../preview.module.css";

const detailTabs = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "files", label: "Files" },
] as const;

type DetailTab = (typeof detailTabs)[number]["id"];
type TimelineItem = (typeof previewTimeline)[number];

const files = [
  { name: "Northstar proposal.pdf", meta: "2.4 MB · Shared 4 days ago", icon: FileText },
  { name: "Homepage concept v2.fig", meta: "18.1 MB · Shared today", icon: Sparkles },
  { name: "Brand photography.zip", meta: "84 MB · Received yesterday", icon: FileText },
  { name: "Invoice 1042.pdf", meta: "Paid · 1 week ago", icon: ReceiptText },
];

const relatedContacts = [
  { initials: "ES", name: "Elin Sandberg", role: "Marketing director", primary: true },
  { initials: "JL", name: "Johan Lind", role: "Clinic owner", primary: false },
];

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className={styles.timeline}>
      {items.map((item) => (
        <li className={styles.timelineItem} key={`${item.title}-${item.meta}`}>
          <span className={`${styles.timelineDot} ${styles[`tone-${item.tone}`]}`} aria-hidden="true" />
          <div className={styles.timelineContent}>
            <strong>{item.title}</strong>
            <span>{item.meta}</span>
            <p>{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ContactPanel() {
  return (
    <Card className={styles.sidePanel}>
      <span className={styles.eyebrow}>PRIMARY CONTACT</span>
      <div className={styles.contactIdentity}>
        <span className={styles.contactAvatar}>ES</span>
        <div>
          <h2>Elin Sandberg</h2>
          <p>Marketing director</p>
        </div>
      </div>
      <div className={styles.sideList}>
        <a href="mailto:elin@northstar.example" className={styles.sideLink}>
          <Mail size={15} aria-hidden="true" />
          elin@northstar.example
        </a>
        <span className={styles.sideRow}>
          <UserRound size={15} aria-hidden="true" />
          Owner: Alexandra
        </span>
        <span className={styles.sideRow}>
          <Clock3 size={15} aria-hidden="true" />
          Reply within 2 days
        </span>
      </div>
    </Card>
  );
}

function NextStepPanel({ onPreview }: { onPreview: () => void }) {
  return (
    <Card className={styles.sidePanel}>
      <span className={styles.eyebrow}>NEXT STEP</span>
      <h2>Review homepage concept</h2>
      <p className={styles.sideDescription}>
        Client feedback is due Friday. Confirm the hero direction before the build handover.
      </p>
      <div className={styles.sideList}>
        <span className={styles.sideRow}><CalendarDays size={15} aria-hidden="true" /> Due 14 Nov</span>
        <span className={styles.sideRow}><ShieldCheck size={15} aria-hidden="true" /> Accessibility review included</span>
      </div>
      <Button type="button" variant="secondary" size="sm" block onClick={onPreview}>
        Open task preview
      </Button>
    </Card>
  );
}

export function DetailSection({
  onNavigate,
}: {
  onNavigate: (section: PreviewSectionId) => void;
}) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const [activityOpen, setActivityOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [timeline, setTimeline] = useState<TimelineItem[]>(previewTimeline);
  const [notice, setNotice] = useState("");

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + direction + detailTabs.length) % detailTabs.length;
    const nextTab = detailTabs[next];
    setTab(nextTab.id);
    requestAnimationFrame(() => document.getElementById(`detail-tab-${nextTab.id}`)?.focus());
  }

  function saveActivity() {
    const body = draft.trim();
    if (!body) return;
    setTimeline((current) => [
      { title: "Note added in preview", meta: "Just now · Alexandra", body, tone: "info" },
      ...current,
    ]);
    setDraft("");
    setActivityOpen(false);
    setNotice("Note added to local preview state. Nothing was persisted or sent to a server.");
  }

  return (
    <div className={styles.sectionStack}>
      <header className={styles.detailHero}>
        <div className={styles.detailTopRow}>
          <button type="button" className={styles.backLink} onClick={() => onNavigate("collection")}>
            <ArrowLeft size={15} aria-hidden="true" />
            Clients
          </button>
          <span className={styles.signalBadge}><span aria-hidden="true" /> On track · signal healthy</span>
        </div>

        <div className={styles.entityHeader}>
          <span className={styles.entityMark}>
            ND
            <span aria-hidden="true" />
          </span>
          <div className={styles.entityIdentity}>
            <div className={styles.entityTags}>
              <StatusBadge tone="success">Active client</StatusBadge>
              <StatusBadge tone="info">Website redesign</StatusBadge>
              <StatusBadge>Enterprise</StatusBadge>
            </div>
            <h1>Northstar Dental</h1>
            <p>Dental care · Jonkoping · Client since March 2025</p>
          </div>
          <div className={styles.entityActions}>
            <ActionLink href="mailto:elin@northstar.example" variant="secondary">
              <Mail size={15} aria-hidden="true" />
              Email client
            </ActionLink>
            <Button type="button" onClick={() => setActivityOpen(true)}>
              <Plus size={16} aria-hidden="true" />
              Add note
            </Button>
          </div>
        </div>

        <dl className={styles.dealStrip}>
          <div><dt>Contract value</dt><dd>SEK 184,000</dd></div>
          <div><dt>Open tasks</dt><dd>6</dd></div>
          <div><dt>Next review</dt><dd>14 Nov</dd></div>
          <div><dt>Health</dt><dd><span className={styles.signalText}>On track</span></dd></div>
        </dl>
      </header>

      {notice && (
        <div className={styles.successAlert} role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      <div className={styles.detailTabs} role="tablist" aria-label="Client detail sections">
        {detailTabs.map((item, index) => (
          <button
            key={item.id}
            id={`detail-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`detail-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            className={`${styles.tabButton} ${tab === item.id ? styles.tabActive : ""}`}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => handleTabKey(event, index)}
          >
            {item.label}
            {item.id === "activity" && <span className={styles.tabCount}>{timeline.length}</span>}
          </button>
        ))}
      </div>

      <div
        id="detail-panel-overview"
        role="tabpanel"
        aria-labelledby="detail-tab-overview"
        hidden={tab !== "overview"}
      >
        <div className={styles.detailGrid}>
          <div className={styles.detailMain}>
            <section className={styles.nextActionCard}>
              <span className={styles.nextActionBar} aria-hidden="true" />
              <div>
                <span className={styles.eyebrow}>NEXT BEST ACTION</span>
                <h2>Send homepage direction for approval</h2>
                <p>Concept v2 is ready. The client is waiting for the hero and booking flow decision.</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => setActivityOpen(true)}>
                Add context
              </Button>
            </section>

            <Card padding="none">
              <div className={styles.panelHeaderCompact}>
                <div>
                  <span className={styles.eyebrow}>RECENT ACTIVITY</span>
                  <h2>What changed</h2>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setTab("activity")}>
                  View all
                </Button>
              </div>
              <div className={styles.timelineWrap}>
                <Timeline items={timeline.slice(0, 3)} />
              </div>
            </Card>

            <Card padding="none">
              <div className={styles.panelHeaderCompact}>
                <div>
                  <span className={styles.eyebrow}>NOTES</span>
                  <h2>Pinned context</h2>
                </div>
                <Button type="button" size="sm" onClick={() => setActivityOpen(true)}>
                  <Plus size={15} aria-hidden="true" />
                  Add note
                </Button>
              </div>
              <div className={styles.noteBlock}>
                <p>“Client wants the booking journey to feel calmer and faster. Keep the team page simple.”</p>
                <span>Alexandra · 3 days ago</span>
              </div>
            </Card>

            <Card padding="none">
              <div className={styles.panelHeaderCompact}>
                <div>
                  <span className={styles.eyebrow}>SCOPE</span>
                  <h2>Website redesign</h2>
                </div>
                <StatusBadge tone="info">In progress</StatusBadge>
              </div>
              <div className={styles.scopeGrid}>
                <div><span>Phases</span><strong>4</strong><small>2 complete</small></div>
                <div><span>Tasks</span><strong>6</strong><small>3 due this week</small></div>
                <div><span>Launch</span><strong>12 Dec</strong><small>On track</small></div>
                <div><span>Budget</span><strong>SEK 184k</strong><small>Fixed scope</small></div>
              </div>
            </Card>
          </div>

          <aside className={styles.detailSidebar} aria-label="Client context">
            <ContactPanel />
            <NextStepPanel onPreview={() => setNotice("Task preview is a visual-only interaction in this static design preview.")} />
            <Card className={styles.sidePanel}>
              <span className={styles.eyebrow}>RELATED CONTACTS</span>
              <div className={styles.relatedContacts}>
                {relatedContacts.map((contact) => (
                  <div className={styles.relatedContact} key={contact.name}>
                    <span>{contact.initials}</span>
                    <div>
                      <strong>{contact.name}</strong>
                      <small>{contact.role}</small>
                    </div>
                    {contact.primary && <span className={styles.primaryTag}>Primary</span>}
                  </div>
                ))}
              </div>
            </Card>
            <Card className={styles.sidePanel}>
              <span className={styles.eyebrow}>TAGS</span>
              <div className={styles.tagList}>
                <span className={styles.tag}>Priority account</span>
                <span className={styles.tag}>Newsletter</span>
                <span className={styles.tag}>Referral</span>
                <span className={styles.tag}>SEO</span>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <div
        id="detail-panel-activity"
        role="tabpanel"
        aria-labelledby="detail-tab-activity"
        hidden={tab !== "activity"}
      >
        <Card padding="none">
          <div className={styles.panelHeaderCompact}>
            <div>
              <span className={styles.eyebrow}>ACTIVITY</span>
              <h2>Full timeline</h2>
            </div>
            <Button type="button" size="sm" onClick={() => setActivityOpen(true)}>
              <Plus size={15} aria-hidden="true" />
              Add note
            </Button>
          </div>
          <div className={styles.timelineWrap}><Timeline items={timeline} /></div>
        </Card>
      </div>

      <div
        id="detail-panel-files"
        role="tabpanel"
        aria-labelledby="detail-tab-files"
        hidden={tab !== "files"}
      >
        <Card padding="none">
          <div className={styles.panelHeaderCompact}>
            <div>
              <span className={styles.eyebrow}>FILES</span>
              <h2>Shared documents</h2>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setNotice("Upload is shown as a visual state only. No file leaves the browser.")}
            >
              Upload preview
            </Button>
          </div>
          <div className={styles.fileList}>
            {files.map((file) => {
              const Icon = file.icon;
              return (
                <div className={styles.fileRow} key={file.name}>
                  <span className={styles.fileIcon}><Icon size={18} aria-hidden="true" /></span>
                  <span className={styles.fileCopy}>
                    <strong>{file.name}</strong>
                    <small>{file.meta}</small>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setNotice(`Preview file: ${file.name}`)}
                  >
                    Open
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <p className={styles.dataNote}>
        The client, activity and documents are fictional. Add-note interactions update local preview state only.
      </p>

      <PreviewDialog
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        title="Add preview note"
        description="This demonstrates the detail-page dialog contract. Nothing is sent to a server."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setActivityOpen(false)}>Cancel</Button>
            <Button type="button" onClick={saveActivity} disabled={!draft.trim()}>Add note</Button>
          </>
        }
      >
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Note</span>
          <span className={styles.fieldHint}>Visible only in this local preview session.</span>
          <textarea
            className={styles.textarea}
            rows={5}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Summarize the conversation or next step"
          />
        </label>
      </PreviewDialog>
    </div>
  );
}
