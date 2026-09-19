import Link from "next/link";
import {
  Inbox,
  PenSquare,
  Settings,
  LogOut,
  Sparkles,
  UserRound,
} from "lucide-react";

export default function HubDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="hub-dashboard">
      <aside className="hub-sidebar">
        <div className="hub-brand">
          <div className="hub-brand-icon">
            <Sparkles size={19} />
          </div>

          <div className="hub-brand-text">
            <strong>Staark</strong>
            <span>Hub</span>
          </div>
        </div>

        <Link href="/hub/compose" className="hub-compose-button">
          <PenSquare size={18} />
          <span>Compose</span>
        </Link>

        <nav className="hub-nav">
          <Link href="/hub" className="hub-nav-item hub-nav-item-active">
            <Inbox size={18} />
            <span>Inbox</span>

            <span className="hub-nav-count">3</span>
          </Link>

          <Link href="/hub/profile" className="hub-nav-item">
            <UserRound size={18} />
            <span>Profile</span>
          </Link>

          <Link href="/hub/settings" className="hub-nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="hub-sidebar-bottom">
          <div className="hub-user">
            <div className="hub-user-avatar">SI</div>

            <div className="hub-user-info">
              <strong>Staark Inc.</strong>
              <span>Administrator</span>
            </div>

            <button
              type="button"
              className="hub-icon-button"
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="hub-content">{children}</main>
    </div>
  );
}