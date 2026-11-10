"use client";

import {
  Bell,
  CheckCircle2,
  Keyboard,
  LayoutPanelLeft,
  Menu,
  Monitor,
  Plus,
  Search,
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
    range: "1280px+",
    detail: "260px midnight sidebar, 68px topbar and a 1280px content frame.",
  },
  {
    icon: LayoutPanelLeft,
    name: "Compact",
    range: "Toggle or 1024px",
    detail: "76px rail keeps navigation while protecting the canvas.",
  },
  {
    icon: Tablet,
    name: "Tablet",
    range: "768px",
    detail: "Content-first layout with modal navigation.",
  },
  {
    icon: Smartphone,
    name: "Mobile",
    range: "320–390px",
    detail: "Modal drawer, icon actions and stacked content.",
  },
];

const navModel = [
  { label: "Workspace", detail: "Dashboard", state: "Live" },
  { label: "CRM", detail: "Clients · Client detail", state: "Live" },
  { label: "Communication", detail: "Inbox", state: "Soon" },
  { label: "Delivery", detail: "Projects", state: "Soon" },
  { label: "Finance", detail: "Billing", state: "Soon" },
  { label: "System", detail: "Forms · Settings · Global shell", state: "Live" },
];

export function ShellSection({
  activeSection,
  compactNav,
  unreadCount,
  onOpenNavigation,
  onOpenNotifications,
  onOpenSearch,
  onOpenQuickCreate,
  onToggleCompact,
}: {
  activeSection: PreviewSectionId;
  compactNav: boolean;
  unreadCount: number;
  onOpenNavigation: () => void;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  onOpenQuickCreate: () => void;
  onToggleCompact: () => void;
}) {
  const section = getPreviewSection(activeSection);

  return (
    <div className={styles.sectionStack}>
      <PageHeader
        className={styles.pageHeader}
        eyebrow="SYSTEM / GLOBAL SHELL"
        title="Global shell"
        description="A single responsive frame for navigation, search, quick creation, notifications and page content."
        action={<StatusBadge tone="success">Preview shell active</StatusBadge>}
      />

      <section className={styles.shellAnatomy} aria-labelledby="shell-anatomy-title">
        <div className={styles.anatomySidebar}>
          <span className={styles.anatomyNumber}>01</span>
          <strong>Sidebar</strong>
          <p>Brand, search, grouped navigation and identity.</p>
          <span className={styles.anatomySignal}><span aria-hidden="true" /> Midnight + signal lime</span>
        </div>
        <div className={styles.anatomyMain}>
          <div className={styles.anatomyTopbar}>
            <span className={styles.anatomyNumber}>02</span>
            <div><strong>Topbar</strong><p>Breadcrumb, quick create, notifications and user.</p></div>
          </div>
          <div className={styles.anatomyCanvas}>
            <span className={styles.anatomyNumber}>03</span>
            <div>
              <strong id="shell-anatomy-title">Canvas</strong>
              <p>One h1, primary action and a focused operational layout.</p>
            </div>
          </div>
        </div>
      </section>

      <Card padding="none" className={styles.shellActionRail}>
        <div>
          <span className={styles.eyebrow}>TRY THE SHELL</span>
          <h2>Every global action is live in this preview.</h2>
        </div>
        <div className={styles.shellActions}>
          <Button type="button" variant="secondary" size="sm" onClick={onOpenSearch}>
            <Search size={15} aria-hidden="true" /> Search
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onOpenQuickCreate}>
            <Plus size={15} aria-hidden="true" /> Quick create
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onToggleCompact}>
            <LayoutPanelLeft size={15} aria-hidden="true" />
            {compactNav ? "Expand nav" : "Compact nav"}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onOpenNavigation}>
            <Menu size={15} aria-hidden="true" /> Mobile nav
          </Button>
          <Button type="button" size="sm" onClick={onOpenNotifications}>
            <Bell size={15} aria-hidden="true" /> Notifications · {unreadCount}
          </Button>
        </div>
      </Card>

      <div className={styles.shellModeGrid}>
        {shellModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card key={mode.name} className={styles.shellModeCard}>
              <span className={styles.shellModeIcon}><Icon size={18} aria-hidden="true" /></span>
              <span className={styles.eyebrow}>{mode.range}</span>
              <h2>{mode.name}</h2>
              <p>{mode.detail}</p>
            </Card>
          );
        })}
      </div>

      <div className={styles.shellInfoGrid}>
        <Card padding="none">
          <div className={styles.panelHeaderCompact}>
            <div>
              <span className={styles.eyebrow}>NAVIGATION MODEL</span>
              <h2>Logical groups, stable destinations</h2>
            </div>
            <StatusBadge tone="info">One active item</StatusBadge>
          </div>
          <div className={styles.navModel}>
            {navModel.map((group) => (
              <div className={styles.navModelRow} key={group.label}>
                <span>{group.label}</span>
                <small>{group.detail}</small>
                <strong className={group.state === "Live" ? styles.navModelLive : styles.navModelSoon}>
                  {group.state}
                </strong>
              </div>
            ))}
          </div>
          <div className={styles.panelFooter}>
            <span className={styles.footnote}>Active: {section.label}</span>
            <span className={styles.footnote}>No production navigation points here.</span>
          </div>
        </Card>

        <Card>
          <span className={styles.eyebrow}>ACCESSIBILITY</span>
          <h2>Focus survives every overlay</h2>
          <ul className={styles.checkList}>
            <li><CheckCircle2 size={16} aria-hidden="true" /> Native modal navigation, search and notifications.</li>
            <li><CheckCircle2 size={16} aria-hidden="true" /> Escape closes overlays and restores trigger focus.</li>
            <li><Keyboard size={16} aria-hidden="true" /> Ctrl/⌘ K opens global search.</li>
            <li><CheckCircle2 size={16} aria-hidden="true" /> Active navigation uses weight, rail and aria-current.</li>
            <li><CheckCircle2 size={16} aria-hidden="true" /> Compact mode preserves accessible names.</li>
            <li><CheckCircle2 size={16} aria-hidden="true" /> Reduced motion removes non-essential transitions.</li>
          </ul>
        </Card>
      </div>

      <p className={styles.dataNote}>
        This section documents the shell contract and live interactions. The production shell was not modified.
      </p>
    </div>
  );
}
