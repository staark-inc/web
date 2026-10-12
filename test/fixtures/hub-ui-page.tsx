// Copied into app/hub-ui-fixture only for browser checks. Never a production route.
import Link from "next/link";
import { ArrowRight, Bell, Building2, Clock3, FolderKanban, Inbox, LogOut, PenSquare, Plus, Rocket } from "lucide-react";
import { ActionLink, Metric, Metrics, PageHeader, StatusBadge, WorkspacePage } from "@/components/hub/workspace";
import { WorkspaceTabs } from "@/components/hub/WorkspaceTabs";
import HubLayout from "@/app/hub/layout";
import HubSidebar from "@/app/hub/(dashboard)/HubSidebar";
import HubNav from "@/app/hub/(dashboard)/HubNav";
import NotificationCenter from "@/app/hub/(dashboard)/NotificationCenter";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
const url = "/hub-ui-fixture";
const fixtureProjects = [
  { name: "Website redesign", progress: 75, done: 3 },
  { name: "Customer booking platform", progress: 50, done: 2 },
  { name: "Brand and content launch", progress: 25, done: 1 },
];

export default async function HubUiFixture({ searchParams }: { searchParams: Promise<{ compact?: string; view?: string }> }) {
  const { compact, view } = await searchParams;
  return <HubLayout><div className={`hub-dashboard ${compact ? "hub-dashboard-sidebar-compact" : ""}`}>
    <HubSidebar>
      <Link href={url} className="hub-brand" aria-label="Staark Hub overview"><div className="hub-brand-icon"><FolderKanban size={25} /></div><div className="hub-brand-text"><strong>Staark</strong><span>Hub</span></div></Link>
      <Link href={url} className="hub-compose-button hub-compact-tooltip" aria-label="Compose" data-tooltip="Compose"><PenSquare size={18} /><span>Compose</span></Link>
      <HubNav unreadCount={8} newLeadCount={3} showCounts />
      <div className="hub-sidebar-bottom">
        <NotificationCenter initialNotifications={[]} initialUnread={4} />
        <div className="hub-user"><Link href={url} className="hub-user-profile-link"><div className="hub-user-avatar">AV</div><div className="hub-user-info"><strong>Alexandra Visitor</strong><span>Administrator</span></div></Link><div className="hub-logout-form"><button className="hub-icon-button hub-logout-button" aria-label="Sign out"><LogOut size={17} /></button></div></div>
      </div>
    </HubSidebar>
    <main className="hub-content">
      {view === "preferences" ? <div className="hub-page hub-notification-preferences-page">
        <header className="hub-page-header"><div><span className="hub-eyebrow">PROFILE</span><h1>Notifications</h1><p>Choose which Hub activity should create persistent notifications for your account.</p></div></header>
        <section className="hub-notification-preferences-card">
          <div className="hub-notification-preferences-head"><div className="hub-notification-preferences-head-icon"><Bell size={19} /></div><div><h2>Activity notifications</h2><p>These settings control what appears in the Hub notification center.</p></div></div>
          <div className="hub-notification-preferences-list">{["New emails", "New leads", "Offer activity", "Support requests", "Billing events"].map((name) => <label className="hub-notification-preference-row" key={name}><span className="hub-notification-preference-icon"><Inbox size={17} /></span><span className="hub-notification-preference-copy"><strong>{name}</strong><small>Incoming customer messages and activity from your workspace.</small></span><span className="hub-notification-switch"><input type="checkbox" defaultChecked /><span aria-hidden="true" /></span></label>)}</div>
          <div className="hub-notification-preferences-footer"><div><strong>Persistent by design</strong><span>Disabled categories stop creating new notifications; existing history stays intact.</span></div><button className="hub-send-button">Save notification settings</button></div>
        </section>
      </div> : <WorkspacePage>
        <div className="sw-projects-page sw-projects-board-page">
          <PageHeader
            eyebrow="WORK / DELIVERY"
            title="Projects"
            description="Delivery is clear. No overdue or near-term deadlines."
            action={<ActionLink href={url}><Plus size={16} /> New project</ActionLink>}
          />
          <Metrics label="Delivery overview">
            <Metric label="Active" value={8} description="In progress or review" icon={<FolderKanban size={18} />} />
            <Metric label="Waiting" value={2} description="Client input needed" icon={<Clock3 size={18} />} />
            <Metric label="Due soon" value={3} description="Within the next 7 days" icon={<Clock3 size={18} />} />
            <Metric label="Overdue" value={0} description="All clear" icon={<FolderKanban size={18} />} />
          </Metrics>
          <div className="sw-projects-section-heading">
            <div><span className="sw-eyebrow">DELIVERY</span><h2>Project portfolio</h2></div>
            <span>{fixtureProjects.length} shown</span>
          </div>
          <WorkspaceTabs
            label="Project filters"
            activeKey="ALL"
            tabs={[
              { key: "ALL", label: "All", href: url, count: 12 },
              { key: "PLANNING", label: "Planning", href: url, count: 2 },
              { key: "IN_PROGRESS", label: "In progress", href: url, count: 5 },
              { key: "WAITING_CLIENT", label: "Waiting on client", href: url, count: 2 },
              { key: "REVIEW", label: "Review", href: url, count: 1 },
              { key: "COMPLETED", label: "Completed", href: url, count: 2 },
            ]}
          />
          <section className="sw-board-grid" aria-label="Projects">
            {fixtureProjects.map((project) => (
              <article className="sw-board-card" key={project.name}>
                <header className="sw-board-card-head">
                  <span className="sw-board-icon"><FolderKanban size={19} /></span>
                  <span className="sw-board-title">
                    <Link href={url}>{project.name}</Link>
                    <small><Building2 size={13} />Example Studio</small>
                  </span>
                  <StatusBadge tone="info">In progress</StatusBadge>
                </header>
                <div className="sw-board-card-body">
                  <div className="sw-board-progress-heading"><span>Task progress</span><strong>{project.progress}%</strong></div>
                  <progress max={100} value={project.progress} aria-label={project.name + " task completion"} />
                  <div className="sw-board-task-count">{project.done} of 4 tasks complete</div>
                  <div className="sw-board-next-task">
                    <span className="sw-eyebrow">NEXT STEP</span>
                    <strong>Review the first design</strong>
                  </div>
                  <div className="sw-board-facts">
                    <span><Clock3 size={15} />20 Oct 2026</span>
                    <span><Rocket size={15} />Demo ready</span>
                  </div>
                </div>
                <footer className="sw-board-footer">
                  <small>Updated today</small>
                  <Link href={url} className="sw-board-open">Open project <ArrowRight size={15} /></Link>
                </footer>
              </article>
            ))}
          </section>
        </div>
      </WorkspacePage>}
    </main>
  </div></HubLayout>;
}
