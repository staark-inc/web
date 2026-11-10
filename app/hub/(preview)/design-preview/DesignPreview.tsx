"use client";

import {
  Bell,
  Building2,
  ClipboardPenLine,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Menu,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ReceiptText,
  Search,
  Settings2,
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
import { previewClients, previewNotifications } from "./preview-data";
import styles from "./preview.module.css";
import { CollectionSection } from "./sections/CollectionSection";
import { DashboardSection } from "./sections/DashboardSection";
import { DetailSection } from "./sections/DetailSection";
import { FormsSection } from "./sections/FormsSection";
import { SettingsSection } from "./sections/SettingsSection";
import { ShellSection } from "./sections/ShellSection";

type SectionNavItem = {
  type: "section";
  id: PreviewSectionId;
  label: string;
  icon: LucideIcon;
  meta?: string;
};

type SoonNavItem = {
  type: "soon";
  label: string;
  icon: LucideIcon;
};

type NavItem = SectionNavItem | SoonNavItem;

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Workspace",
    items: [
      { type: "section", id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "CRM",
    items: [
      { type: "section", id: "collection", label: "Clients", icon: UsersRound, meta: "12" },
      { type: "section", id: "detail", label: "Client detail", icon: Building2 },
    ],
  },
  {
    label: "Communication",
    items: [{ type: "soon", label: "Inbox", icon: Inbox }],
  },
  {
    label: "Delivery",
    items: [{ type: "soon", label: "Projects", icon: FolderKanban }],
  },
  {
    label: "Finance",
    items: [{ type: "soon", label: "Billing", icon: ReceiptText }],
  },
  {
    label: "System",
    items: [
      { type: "section", id: "forms", label: "Forms", icon: ClipboardPenLine },
      { type: "section", id: "settings", label: "Settings", icon: Settings2 },
      { type: "section", id: "shell", label: "Global shell", icon: PanelLeft },
    ],
  },
];

const quickCreateItems = [
  { label: "New client", hint: "Open the intake form", section: "forms" as const, icon: Building2 },
  { label: "New offer", hint: "Start a commercial draft", section: "forms" as const, icon: ClipboardPenLine },
  { label: "Log activity", hint: "Add a client note", section: "detail" as const, icon: Inbox },
];

type SearchEntry = {
  label: string;
  hint: string;
  section: PreviewSectionId;
  kind: "Section" | "Client" | "Setting";
};

const searchEntries: SearchEntry[] = [
  ...PREVIEW_SECTIONS.map((section) => ({
    label: section.label,
    hint: section.description,
    section: section.id,
    kind: "Section" as const,
  })),
  ...previewClients.slice(0, 6).map((client) => ({
    label: client.company,
    hint: `${client.contact} · ${client.status}`,
    section: "collection" as const,
    kind: "Client" as const,
  })),
  {
    label: "Multi-factor authentication",
    hint: "Security settings preview",
    section: "settings",
    kind: "Setting",
  },
  {
    label: "Notification preferences",
    hint: "Switches and delivery preferences",
    section: "settings",
    kind: "Setting",
  },
];

function PreviewNav({
  activeSection,
  onSelect,
  compact = false,
}: {
  activeSection: PreviewSectionId;
  onSelect: (section: PreviewSectionId) => void;
  compact?: boolean;
}) {
  return (
    <nav className={styles.nav} aria-label="Preview sections">
      {navGroups.map((group) => (
        <div className={styles.navGroup} key={group.label}>
          <span className={styles.navGroupLabel}>{group.label}</span>
          <div className={styles.navList}>
            {group.items.map((item) => {
              const Icon = item.icon;
              if (item.type === "soon") {
                return (
                  <span className={styles.navSoon} key={item.label} title={`${item.label} is planned for a later UI PR`}>
                    <span className={styles.navIcon}><Icon size={17} aria-hidden="true" /></span>
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={styles.soonBadge}>Soon</span>
                  </span>
                );
              }
              const active = item.id === activeSection;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`${styles.navButton} ${active ? styles.navActive : ""}`}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  onClick={() => onSelect(item.id)}
                >
                  <span className={styles.navBar} aria-hidden="true" />
                  <span className={styles.navIcon}><Icon size={17} aria-hidden="true" /></span>
                  <span className={styles.navLabel}>{item.label}</span>
                  {!compact && item.meta && <span className={styles.navMeta}>{item.meta}</span>}
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
  const [compactNav, setCompactNav] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState(previewNotifications);
  const mainRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const section = getPreviewSection(activeSection);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications],
  );
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return searchEntries.slice(0, 7);
    return searchEntries
      .filter((entry) => `${entry.label} ${entry.hint} ${entry.kind}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [searchQuery]);

  useEffect(() => {
    document.title = `${section.label} | Staark Hub preview`;
  }, [section.label]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        setNotificationsOpen(false);
        setQuickCreateOpen(false);
        setMobileNavOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [searchOpen]);

  function closeOtherDialogs() {
    setNotificationsOpen(false);
    setSearchOpen(false);
    setQuickCreateOpen(false);
    setMobileNavOpen(false);
  }

  function navigate(next: PreviewSectionId) {
    setActiveSection(next);
    closeOtherDialogs();
    window.history.replaceState(null, "", `/hub/design-preview?section=${next}`);
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
  }

  function openSearch() {
    closeOtherDialogs();
    setSearchOpen(true);
  }

  function openQuickCreate() {
    closeOtherDialogs();
    setQuickCreateOpen(true);
  }

  function markAllRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false })),
    );
  }

  return (
    <div
      className={`${styles.shell} ${compactNav ? styles.shellCompact : ""}`}
      data-sw-ui=""
      data-compact={compactNav ? "true" : "false"}
    >
      <a href="#preview-main" className={styles.skipLink}>Skip to preview content</a>

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandGlyph}>S<span className={styles.brandDot} /></span>
          <span className={styles.brandCopy}>
            <strong>STAARK</strong>
            <span>Operations Cloud</span>
          </span>
        </div>

        <button
          type="button"
          className={styles.sidebarSearch}
          onClick={openSearch}
          aria-label="Search Staark preview"
        >
          <Search size={16} aria-hidden="true" />
          <span>Search or jump to...</span>
          <kbd>⌘K</kbd>
        </button>

        <PreviewNav activeSection={activeSection} onSelect={navigate} compact={compactNav} />

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarNotice}>
            <span className={styles.statusDot} aria-hidden="true" />
            Preview V2 · static data
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
            <button
              type="button"
              className={styles.compactButton}
              onClick={() => setCompactNav((current) => !current)}
              aria-label={compactNav ? "Expand navigation" : "Collapse navigation"}
              aria-pressed={compactNav}
              title={compactNav ? "Expand navigation" : "Collapse navigation"}
            >
              {compactNav ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
            </button>
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <span className={styles.breadcrumbMuted}>Design preview</span>
              <span className={styles.breadcrumbSeparator} aria-hidden="true">/</span>
              <strong aria-current="page">{section.label}</strong>
            </nav>
            <span className={styles.versionBadge}>V2</span>
          </div>

          <div className={styles.topbarEnd}>
            <button
              type="button"
              className={styles.searchButton}
              onClick={openSearch}
              aria-label="Search Staark preview"
            >
              <Search size={18} aria-hidden="true" />
            </button>
            <Button type="button" size="sm" onClick={openQuickCreate} aria-label="Quick create">
              <Plus size={15} aria-hidden="true" />
              <span className={styles.createLabel}>Create</span>
            </Button>
            <button
              type="button"
              className={styles.notificationButton}
              onClick={() => {
                closeOtherDialogs();
                setNotificationsOpen(true);
              }}
              aria-label={`Notifications, ${unreadCount} unread`}
              aria-haspopup="dialog"
            >
              <Bell size={18} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className={styles.notificationDot} aria-hidden="true">{unreadCount}</span>
              )}
            </button>
            <div className={styles.topbarUser} title="Preview administrator">
              <span className={styles.topbarAvatar}>AV</span>
              <span className={styles.topbarUserCopy}>
                <strong>Alexandra</strong>
                <small>Admin</small>
              </span>
            </div>
          </div>
        </header>

        <main id="preview-main" ref={mainRef} tabIndex={-1} className={styles.content}>
          <p className={styles.srOnly} aria-live="polite">Showing {section.label} preview</p>

          {activeSection === "dashboard" && <DashboardSection onNavigate={navigate} />}
          {activeSection === "collection" && <CollectionSection onNavigate={navigate} />}
          {activeSection === "detail" && <DetailSection onNavigate={navigate} />}
          {activeSection === "forms" && <FormsSection />}
          {activeSection === "settings" && <SettingsSection />}
          {activeSection === "shell" && (
            <ShellSection
              activeSection={activeSection}
              compactNav={compactNav}
              unreadCount={unreadCount}
              onOpenNavigation={() => setMobileNavOpen(true)}
              onOpenNotifications={() => {
                closeOtherDialogs();
                setNotificationsOpen(true);
              }}
              onOpenSearch={openSearch}
              onOpenQuickCreate={openQuickCreate}
              onToggleCompact={() => setCompactNav((current) => !current)}
            />
          )}
        </main>
      </div>

      <PreviewDialog
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Preview navigation"
        description="Modal navigation with focus trap, Escape close and focus restoration."
        className={styles.mobileNavDialog}
      >
        <div className={styles.mobileBrand}>
          <span className={styles.brandGlyph}>S<span className={styles.brandDot} /></span>
          <span>
            <strong>STAARK</strong>
            <small>Operations Cloud</small>
          </span>
        </div>
        <button type="button" className={styles.mobileSearch} onClick={openSearch}>
          <Search size={16} aria-hidden="true" />
          Search or jump to...
        </button>
        <PreviewNav activeSection={activeSection} onSelect={navigate} />
        <p className={styles.mobileNavNote}>
          Preview V2 · static mock data. No production navigation is connected.
        </p>
      </PreviewDialog>

      <PreviewDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Search Staark"
        description="Find preview sections, fictional clients and settings. Press Escape to close."
        className={styles.searchDialog}
      >
        <label className={styles.dialogSearchField}>
          <span className={styles.srOnly}>Search preview</span>
          <Search size={17} aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search sections, clients, settings..."
          />
        </label>
        <div className={styles.searchResults}>
          {searchResults.length === 0 ? (
            <p className={styles.searchEmpty}>No preview matches. Try “clients”, “MFA” or “shell”.</p>
          ) : (
            searchResults.map((entry) => (
              <button
                type="button"
                key={`${entry.kind}-${entry.label}`}
                className={styles.searchResult}
                onClick={() => navigate(entry.section)}
              >
                <span className={styles.searchResultKind}>{entry.kind}</span>
                <span>
                  <strong>{entry.label}</strong>
                  <small>{entry.hint}</small>
                </span>
                <span className={styles.searchResultArrow} aria-hidden="true">↗</span>
              </button>
            ))
          )}
        </div>
      </PreviewDialog>

      <PreviewDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        title="Quick create"
        description="Local preview actions. Nothing is written to a database."
        className={styles.quickCreateDialog}
      >
        <div className={styles.quickCreateList}>
          {quickCreateItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.label}
                className={styles.quickCreateItem}
                onClick={() => navigate(item.section)}
              >
                <span className={styles.quickCreateIcon}><Icon size={18} aria-hidden="true" /></span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            );
          })}
        </div>
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
              <span className={styles.notificationIcon} aria-hidden="true"><Bell size={16} /></span>
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
