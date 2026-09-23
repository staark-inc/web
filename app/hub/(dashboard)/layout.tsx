import Link from "next/link";
import {
  PenSquare,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCustomerUnreadCount } from "@/lib/crm-unread";
import { getSession } from "@/lib/auth";
import {
  countUnreadNotifications,
  listNotifications,
} from "@/lib/notifications";

import HubNav from "./HubNav";
import LiveUpdates from "./LiveUpdates";
import NotificationCenter from "./NotificationCenter";

export const dynamic = "force-dynamic";

function getInitials(name: string, email: string) {
  if (name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

export default async function HubDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/hub/login");
  }

  const cookieStore = await cookies();
  const sidebarMode =
    cookieStore.get("hub_sidebar")?.value === "compact"
      ? "compact"
      : "standard";
  const showCounts =
    cookieStore.get("hub_counts")?.value !== "hide";

  const [
    unreadCount,
    newLeadCount,
    user,
    notifications,
    notificationUnread,
  ] = await Promise.all([
    getCustomerUnreadCount(),
    prisma.lead.count({
      where: {
        status: "NEW",
      },
    }),
    prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        name: true,
        email: true,
        role: true,
      },
    }),
    listNotifications(session.userId, 12),
    countUnreadNotifications(session.userId),
  ]);

  if (!user) {
    redirect("/hub/login");
  }

  const initials = getInitials(user.name, user.email);
  const initialNotifications = notifications.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    message: item.message,
    href: item.href,
    readAt: item.readAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <div
      className={`hub-dashboard ${
        sidebarMode === "compact"
          ? "hub-dashboard-sidebar-compact"
          : ""
      }`}
    >
      <LiveUpdates />

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

        <Link
          href="/hub/compose"
          className="hub-compose-button hub-compact-tooltip"
          aria-label="Compose"
          data-tooltip="Compose"
        >
          <PenSquare size={18} />
          <span>Compose</span>
        </Link>

        <HubNav
          unreadCount={unreadCount}
          newLeadCount={newLeadCount}
          showCounts={showCounts}
        />

        <div className="hub-sidebar-bottom">
          <NotificationCenter
            initialNotifications={initialNotifications}
            initialUnread={notificationUnread}
          />

          <div className="hub-user">
            <Link
              href="/hub/profile"
              className="hub-user-profile-link hub-compact-tooltip"
              aria-label="Open profile"
              data-tooltip="Profile"
            >
              <div className="hub-user-avatar">
                {initials}
              </div>

              <div className="hub-user-info">
                <strong>{user.name}</strong>
                <span>
                  {user.role === "ADMIN"
                    ? "Administrator"
                    : user.role}
                </span>
              </div>
            </Link>

            <form
              action="/api/hub/logout"
              method="post"
            >
              <button
                type="submit"
                className="hub-icon-button"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="hub-content">
        {children}
      </main>
    </div>
  );
}
