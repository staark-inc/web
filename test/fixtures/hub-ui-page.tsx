// Copied into app/hub-ui-fixture only for browser checks. Never a production route.
import Link from "next/link";
import { Bell, FolderKanban, Inbox, LogOut, PenSquare, Plus } from "lucide-react";
import HubLayout from "@/app/hub/layout";
import HubSidebar from "@/app/hub/(dashboard)/HubSidebar";
import HubNav from "@/app/hub/(dashboard)/HubNav";
import NotificationCenter from "@/app/hub/(dashboard)/NotificationCenter";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
const url = "/hub-ui-fixture";

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
      </div> : <div className="hub-page hub-projects-v2-page">
        <header className="hub-projects-v2-head"><div className="hub-projects-v2-title"><span>WORK / DELIVERY</span><h1>Projects</h1><p>Delivery is clear. No overdue or near-term deadlines.</p></div><Link href={url} className="hub-projects-v2-new"><Plus size={15} />New project</Link></header>
        <section className="hub-projects-v2-stats" aria-label="Delivery overview">{[["Active", "8", "In progress or review"], ["Waiting", "2", "Client input needed"], ["Due soon", "3", "Next 7 days"], ["Overdue", "0", "All clear"]].map(([name, count, text]) => <div className="hub-projects-v2-stat" key={name}><span className="hub-projects-v2-stat-icon"><FolderKanban size={16} /></span><div><small>{name}</small><strong>{count}</strong><span>{text}</span></div></div>)}</section>
        <nav className="hub-projects-v2-filters" aria-label="Project filters">{["All", "Planning", "In progress", "Waiting on client", "Review", "Completed", "Maintenance"].map((name, i) => <Link href={url} className={i === 0 ? "hub-projects-v2-filter-active" : undefined} key={name}><span>{name}</span><strong>{i === 0 ? 12 : 2}</strong></Link>)}</nav>
        <section className="hub-projects-v2-list" aria-label="Projects">{["Website redesign", "Customer booking platform", "Brand and content launch"].map((name, i) => <article className="hub-projects-v2-item" key={name}>
          <div className="hub-projects-v2-item-main"><span className="hub-projects-v2-avatar"><FolderKanban size={17} /></span><div className="hub-projects-v2-identity"><div className="hub-projects-v2-name-line"><Link href={url}>{name}</Link><span className="hub-project-status hub-project-status-in_progress">In progress</span></div><span className="hub-projects-v2-client">Example Studio</span><p>A clear, accessible experience for customers across every device.</p></div></div>
          <div className="hub-projects-v2-progress"><div className="hub-projects-v2-progress-top"><span>Progress</span><strong>{75 - i * 25}%</strong></div><div className="hub-projects-v2-progress-bar"><span style={{ width: `${75 - i * 25}%` }} /></div><span className="hub-projects-v2-progress-sub">Next: Review the first design</span></div>
          <div className="hub-projects-v2-meta"><span className="hub-projects-v2-chip">20 Oct 2026</span><span className="hub-projects-v2-chip hub-projects-v2-chip-good">Materials clear</span><span className="hub-projects-v2-chip hub-projects-v2-chip-good">Support clear</span><span className="hub-projects-v2-chip">Not deployed</span></div>
          <div className="hub-projects-v2-item-footer"><span>Updated today</span><Link href={url}>Open project</Link></div>
        </article>)}</section>
      </div>}
    </main>
  </div></HubLayout>;
}
