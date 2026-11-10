"use client";

import {
  Bell,
  Building2,
  ClipboardPenLine,
  LayoutDashboard,
  Menu,
  PanelLeft,
  Settings2,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button, StatusBadge } from "@/components/hub/ui";

import { PreviewDialog } from "./PreviewDialog";
import {
  getPreviewSection,
  PREVIEW_SECTIONS,
  type PreviewSectionId,
} from "./preview-sections";
import { previewNotifications } from "./preview-data";
import styles from "./preview.module.css";
import { CollectionSection } from "./sections/CollectionSection";
import { DashboardSection } from "./sections/DashboardSection";
import { DetailSection } from "./sections/DetailSection";
import { FormsSection } from "./sections/FormsSection";
import { SettingsSection } from "./sections/SettingsSection";
import { ShellSection } from "./sections/ShellSection";

const sectionIcons: Record<PreviewSectionId, LucideIcon> = {
  dashboard: LayoutDashboard,
  collection: UsersRound,
  detail: Building2,
  forms: ClipboardPenLine,
  settings: Settings2,
  shell: PanelLeft,
};

const navGroups = ["Workspace", "CRM", "System"] as const;

type Navigate = (section: PreviewSectionId) => void;

function PreviewNav({
  activeSection,
  onSelect,
}: {
  activeSection: PreviewSectionId;
  onSelect: Navigate;
}) {
  return (
    <nav className={styles.nav} aria-label="Preview sections">
      {navGroups.map((group) => (
        <div className={styles.navGroup} key={group}>
          <span className={styles.navGroupLabel}>{group}</span>
          <div className={styles.navList}>
            {PREVIEW_SECTIONS.filter((section) => section.group === group).map((section) => {
              const Icon = sectionIcons[section.id];
              const active = section.id === activeSection;
              return (
                <button
                  type="button"
                  key={section.id}
                  className={`${styles.navButton} ${active ? styles.navActive : ""}`}
                  aria-current={active ? "page" : undefined}
                  title={section.label}
                  onClick={() => onSelect(section.id)}
                >
                  <span className={styles.navIcon}>
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className={styles.navLabel}>{section.label}</span>
                  {section.id === "collection" && <span className={styles.navMeta}>12</span>}
                  {section.id === "shell" && <span className={styles.navMeta}>Live</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function DesignPreview({
  initialSection,
}: {
  initialSection: PreviewSectionId;
}) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(previewNotifications);
  const mainRef = useRef<HTMLElement>(null);
  const section = getPreviewSection(activeSection);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications],
  );

  useEffect(() => {
    document.title = `${section.label} | Hub design preview`;
  }, [section.label]);

  function navigate(next: PreviewSectionId) {
    setActiveSection(next);
    setMobileNavOpen(false);
    window.history.replaceState(null, "", `/hub/design-preview?section=${next}`);
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
  }

  function markAllRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false })),
    );
  }

  return (
    <div className={styles.shell} data-sw-ui="">
      <a href="#preview-main" className={styles.skipLink}>Skip to preview content</a>

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <Sparkles size={20} aria-hidden="true" />
          </span>
          <span className={styles.brandCopy}>
            <strong>Staark Hub</strong>
            <span>Design preview</span>
          </span>
        </div>

        <div className={styles.sidebarBadge}>UI preview · static data</div>
        <PreviewNav activeSection={activeSection} onSelect={navigate} />

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarNotice}>
            <span className={styles.statusDot} aria-hidden="true" />
            No live data
          </div>
          <div className={styles.sidebarUser}>
            <span className={styles.avatar}>AV</span>
            <span className={styles.userCopy}>
              <strong>Alexandra Visitor</strong>
              <span>Preview administrator</span>
            </span>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarStart}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open preview navigation"
              aria-haspopup="dialog"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <span className={styles.breadcrumbMuted}>Hub</span>
              <span className={styles.breadcrumbSeparator} aria-hidden="true">/</span>
              <span className={styles.breadcrumbMuted}>Design preview</span>
              <span className={styles.breadcrumbSeparator} aria-hidden="true">/</span>
              <strong aria-current="page">{section.label}</strong>
            </nav>
          </div>

          <div className={styles.topbarEnd}>
            <span className={styles.previewBadge}>STATIC PREVIEW</span>
            <button
              type="button"
              className={styles.notificationButton}
              onClick={() => setNotificationsOpen(true)}
              aria-label={`Notifications, ${unreadCount} unread`}
              aria-haspopup="dialog"
            >
              <Bell size={18} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className={styles.notificationDot} aria-hidden="true">
                  {unreadCount}
                </span>
              )}
            </button>
            <span className={styles.topbarAvatar} title="Preview administrator">AV</span>
          </div>
        </header>

        <main
          id="preview-main"
          ref={mainRef}
          tabIndex={-1}
          className={styles.content}
        >
          <p className={styles.srOnly} aria-live="polite">
            Showing {section.label} preview
          </p>

          {activeSection === "dashboard" && <DashboardSection onNavigate={navigate} />}
          {activeSection === "collection" && <CollectionSection onNavigate={navigate} />}
          {activeSection === "detail" && <DetailSection onNavigate={navigate} />}
          {activeSection === "forms" && <FormsSection />}
          {activeSection === "settings" && <SettingsSection />}
          {activeSection === "shell" && (
            <ShellSection
              activeSection={activeSection}
              unreadCount={unreadCount}
              onOpenNavigation={() => setMobileNavOpen(true)}
              onOpenNotifications={() => setNotificationsOpen(true)}
            />
          )}
        </main>
      </div>

      <PreviewDialog
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Preview navigation"
        description="The mobile shell uses a modal navigation drawer with focus restoration."
        className={styles.mobileNavDialog}
      >
        <div className={styles.mobileBrand}>
          <span className={styles.brandMark}>
            <Sparkles size={20} aria-hidden="true" />
          </span>
          <span>
            <strong>Staark Hub</strong>
            <small>Design preview</small>
          </span>
        </div>
        <PreviewNav
          activeSection={activeSection}
          onSelect={navigate}
        />
        <p className={styles.mobileNavNote}>
          Static mock data only. No production navigation is connected.
        </p>
      </PreviewDialog>

      <PreviewDialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifications"
        description="Local preview state. Marking items read never calls an API."
        footer={
          <>
            <span className={styles.dialogFootnote}>
              {unreadCount === 0 ? "You're all caught up." : `${unreadCount} unread notifications`}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={unreadCount === 0}
              onClick={markAllRead}
            >
              Mark all read
            </Button>
          </>
        }
      >
        <div className={styles.notificationList}>
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`${styles.notificationItem} ${notification.unread ? styles.notificationUnread : ""}`}
            >
              <span className={styles.notificationIcon} aria-hidden="true">
                <Bell size={16} />
              </span>
              <div className={styles.notificationCopy}>
                <div className={styles.notificationTitleRow}>
                  <strong>{notification.title}</strong>
                  <StatusBadge tone={notification.tone}>{notification.unread ? "Unread" : "Read"}</StatusBadge>
                </div>
                <p>{notification.message}</p>
                <time>{notification.time}</time>
              </div>
            </article>
          ))}
        </div>
      </PreviewDialog>
    </div>
  );
}
