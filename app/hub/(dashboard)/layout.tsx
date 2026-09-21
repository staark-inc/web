import Link from "next/link";
import {
  PenSquare,
  LogOut,
  Sparkles,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCustomerUnreadCount } from "@/lib/crm-unread";
import HubNav from "./HubNav";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
import LiveUpdates from "./LiveUpdates";

export default async function HubDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/hub/login");
  }
  
const [unreadCount, newLeadCount] =
  await Promise.all([
    getCustomerUnreadCount(),

    prisma.lead.count({
      where: {
        status: "NEW",
      },
    }),
  ]);

  return (
    <div className="hub-dashboard">
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
          className="hub-compose-button"
        >
          <PenSquare size={18} />
          <span>Compose</span>
        </Link>

        <HubNav unreadCount={unreadCount} newLeadCount={newLeadCount} />

        <div className="hub-sidebar-bottom">
          <div className="hub-user">
            <div className="hub-user-avatar">
              SI
            </div>

            <div className="hub-user-info">
              <strong>Staark Inc.</strong>
              <span>Administrator</span>
            </div>

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
