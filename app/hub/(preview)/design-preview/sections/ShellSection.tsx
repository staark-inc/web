"use client";

import {
  Bell,
  CheckCircle2,
  Keyboard,
  LayoutPanelLeft,
  Menu,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";

import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
} from "@/components/hub/ui";

import {
  getPreviewSection,
  type PreviewSectionId,
} from "../preview-sections";
import styles from "../preview.module.css";

const shellModes = [
  {
    icon: Monitor,
    name: "Desktop",
    range: "1280px and above",
    detail: "260px navy sidebar, sticky topbar and a content measure capped at 1180px.",
    tone: "info" as const,
  },
  {
    icon: LayoutPanelLeft,
    name: "Compact rail",
    range: "769px – 1024px",
    detail: "76px icon rail keeps navigation available while protecting content width.",
    tone: "neutral" as const,
  },
  {
    icon: Tablet,
    name: "Tablet",
    range: "768px",
    detail: "Content-first layout with the mobile navigation drawer and full-width actions.",
    tone: "warning" as const,
  },
  {
    icon: Smartphone,
    name: "Mobile",
    range: "320px – 390px",
    detail: "Modal navigation, stacked metrics, scrollable tabs and 44px touch controls.",
    tone: "success" as const,
  },
];

export function ShellSection({
  activeSection,
  unreadCount,
  onOpenNavigation,
  onOpenNotifications,
}: {
  activeSection: PreviewSectionId;
  unreadCount: number;
  onOpenNavigation: () => void;
  onOpenNotifications: () => void;
}) {
  const section = getPreviewSection(activeSection);

  return (
    <div className={styles.sectionStack}>
      <PageHeader
        className={styles.pageHeader}
        eyebrow="SYSTEM / GLOBAL SHELL"
        title="Global shell"
        description="One responsive frame for sidebar, topbar, navigation, notifications and page content."
        action={<StatusBadge tone="success">Preview shell active</StatusBadge>}
      />

      <Card padding="none" className={styles.shellShowcase}>
        <div className={styles.shellMock}>
          <div className={styles.shellMockSidebar}>
            <span className={styles.shellMockBrand} />
            <span className={styles.shellMockLine} />
            <span className={styles.shellMockLine} />
            <span className={styles.shellMockLine} />
            <span className={styles.shellMockLineShort} />
          </div>
          <div className={styles.shellMockMain}>
            <div className={styles.shellMockTopbar}>
              <span className={styles.shellMockPill} />
              <span className={styles.shellMockAvatar} />
            </div>
            <div className={styles.shellMockContent}>
              <span className={styles.shellMockTitle} />
              <div className={styles.shellMockMetrics}>
                <span /><span /><span /><span />
              </div>
              <div className={styles.shellMockGrid}>
                <span /><span />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.shellShowcaseFooter}>
          <div>
            <span className={styles.eyebrow}>LIVE SHELL</span>
            <h2>The preview is already rendering this frame.</h2>
            <p>
              Resize the browser, open the mobile navigation or inspect the notification dialog.
              The real Hub pages are untouched.
            </p>
          </div>
          <div className={styles.inlineActions}>
            <Button type="button" variant="secondary" onClick={onOpenNavigation}>
              <Menu size={16} aria-hidden="true" />
              Open mobile nav
            </Button>
            <Button type="button" onClick={onOpenNotifications}>
              <Bell size={16} aria-hidden="true" />
              Notifications · {unreadCount}
            </Button>
          </div>
        </div>
      </Card>

      <div className={styles.shellGrid}>
        <Card padding="none">
          <div className={styles.panelHeaderCompact}>
            <div>
              <span className={styles.eyebrow}>RESPONSIVE MODES</span>
              <h2>One shell, three densities</h2>
            </div>
            <StatusBadge tone="info">Approved token values</StatusBadge>
          </div>
          <div className={styles.modeList}>
            {shellModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <div className={styles.modeRow} key={mode.name}>
                  <span className={styles.modeIcon}><Icon size={18} aria-hidden="true" /></span>
                  <div className={styles.modeCopy}>
                    <div>
                      <strong>{mode.name}</strong>
                      <StatusBadge tone={mode.tone}>{mode.range}</StatusBadge>
                    </div>
                    <p>{mode.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card padding="none">
          <div className={styles.panelHeaderCompact}>
            <div>
              <span className={styles.eyebrow}>CURRENT STATE</span>
              <h2>Navigation contract</h2>
            </div>
            <StatusBadge tone="success">Active</StatusBadge>
          </div>
          <dl className={styles.specList}>
            <div><dt>Active section</dt><dd>{section.label}</dd></div>
            <div><dt>Sidebar width</dt><dd>260px / 76px</dd></div>
            <div><dt>Topbar height</dt><dd>72px / 62px</dd></div>
            <div><dt>Notification badge</dt><dd>{unreadCount} unread</dd></div>
            <div><dt>Page title</dt><dd>Exactly one h1</dd></div>
          </dl>
          <div className={styles.panelFooter}>
            <Button type="button" variant="secondary" size="sm" onClick={onOpenNotifications}>
              Inspect notification states
            </Button>
          </div>
        </Card>
      </div>

      <div className={styles.shellGrid}>
        <Card>
          <span className={styles.eyebrow}>NAVIGATION RULES</span>
          <h2>Stable structure, visible state</h2>
          <ul className={styles.checkList}>
            <li><CheckCircle2 size={16} aria-hidden="true" /> Active navigation uses both color and the current-page attribute.</li>
            <li><CheckCircle2 size={16} aria-hidden="true" /> Compact rail keeps an accessible name on every icon.</li>
            <li><CheckCircle2 size={16} aria-hidden="true" /> Counts are supporting metadata, never the only label.</li>
            <li><CheckCircle2 size={16} aria-hidden="true" /> Notification count is included in the button label.</li>
            <li><CheckCircle2 size={16} aria-hidden="true" /> No production Hub navigation points to this preview.</li>
          </ul>
        </Card>

        <Card>
          <span className={styles.eyebrow}>KEYBOARD</span>
          <h2>Focus survives every overlay</h2>
          <ul className={styles.checkList}>
            <li><Keyboard size={16} aria-hidden="true" /> Mobile navigation is a native modal dialog.</li>
            <li><Keyboard size={16} aria-hidden="true" /> Escape closes dialogs and focus returns to the trigger.</li>
            <li><Keyboard size={16} aria-hidden="true" /> Tab order follows topbar, content, then overlay.</li>
            <li><Keyboard size={16} aria-hidden="true" /> Focus rings use the canonical 2px accent outline.</li>
            <li><Keyboard size={16} aria-hidden="true" /> Reduced motion removes non-essential transitions.</li>
          </ul>
        </Card>
      </div>

      <p className={styles.dataNote}>
        This section documents the shell contract. The shell is shared by all preview sections; no production shell was changed.
      </p>
    </div>
  );
}
