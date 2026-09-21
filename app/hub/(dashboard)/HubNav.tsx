"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Send,
  Settings,
  UserRound,
  UsersRound,
  Target,
  FolderKanban,
  FileText,
  CreditCard,
  LifeBuoy,
} from "lucide-react";

type HubNavProps = {
  unreadCount: number;
  newLeadCount: number;
};

export default function HubNav({
  unreadCount,
  newLeadCount,
}: HubNavProps) {
  const pathname = usePathname();

  const isInbox =
    pathname === "/hub/inbox" ||
    pathname.startsWith("/hub/message/");

  const isSent = pathname.startsWith("/hub/sent");

  const isProfile = pathname.startsWith("/hub/profile");

  const isSettings = pathname.startsWith("/hub/settings");
  const isContacts =
    pathname.startsWith("/hub/contacts");

  const isLeads =
    pathname.startsWith("/hub/leads");

  const isClients =
    pathname === "/hub/clients" ||
    pathname.startsWith("/hub/clients/");

  const isProjects =
    pathname === "/hub/projects" ||
    pathname.startsWith("/hub/projects/");

  const isOffers =
    pathname === "/hub/offers" ||
    pathname.startsWith("/hub/offers/");

  const isBilling =
    pathname === "/hub/billing" ||
    pathname.startsWith("/hub/billing/");

  const isSupport =
    pathname === "/hub/support" ||
    pathname.startsWith("/hub/support/");

  return (
    <nav className="hub-nav">
    <Link
      href="/hub"
      className={`hub-nav-item ${
        pathname === "/hub"
          ? "hub-nav-item-active"
          : ""
      }`}
    >
      <LayoutDashboard size={17} />
      <span>Overview</span>
    </Link>

      <Link
        href="/hub/inbox"
        className={`hub-nav-item ${
          isInbox ? "hub-nav-item-active" : ""
        }`}
      >
        <Inbox size={18} />
        <span>Inbox</span>

        {unreadCount > 0 && (
          <span className="hub-nav-count">
            {unreadCount}
          </span>
        )}
      </Link>

      <Link
        href="/hub/sent"
        className={`hub-nav-item ${
          isSent ? "hub-nav-item-active" : ""
        }`}
      >
        <Send size={18} />
        <span>Sent</span>
      </Link>

      <div className="hub-nav-section-label">
        Customers
      </div>

      <Link
        href="/hub/contacts"
        className={`hub-nav-item ${
          isContacts
            ? "hub-nav-item-active"
            : ""
        }`}
      >
        <UsersRound size={17} />
        <span>Contacts</span>
      </Link>

      <Link
        href="/hub/leads"
        className={`hub-nav-item ${
          isLeads
            ? "hub-nav-item-active"
            : ""
        }`}
      >
        <Target size={17} />
        <span>Leads</span>
        {newLeadCount > 0 && (
          <span className="hub-nav-count">
            {newLeadCount > 99
              ? "99+"
              : newLeadCount}
          </span>
        )}
      </Link>

      <Link
        href="/hub/clients"
        className={`hub-nav-item ${
          isClients ? "hub-nav-item-active" : ""
        }`}
      >
        <FolderKanban size={17} />
        <span>Clients</span>
      </Link>

      <div className="hub-nav-section-label">Work</div>
      <Link
        href="/hub/projects"
        className={`hub-nav-item ${
          isProjects ? "hub-nav-item-active" : ""
        }`}
      >
        <FolderKanban size={17} />
        <span>Projects</span>
      </Link>

      <Link
        href="/hub/offers"
        className={`hub-nav-item ${
          isOffers ? "hub-nav-item-active" : ""
        }`}
      >
        <FileText size={17} />
        <span>Offers</span>
      </Link>

      <div className="hub-nav-section-label">Operations</div>

      <Link
        href="/hub/billing"
        className={`hub-nav-item ${
          isBilling ? "hub-nav-item-active" : ""
        }`}
      >
        <CreditCard size={17} />
        <span>Billing</span>
      </Link>

      <Link
        href="/hub/support"
        className={`hub-nav-item ${
          isSupport ? "hub-nav-item-active" : ""
        }`}
      >
        <LifeBuoy size={17} />
        <span>Support</span>
      </Link>

      <div className="hub-nav-section-label">
        Account
      </div>

      <Link
        href="/hub/profile"
        className={`hub-nav-item ${
          isProfile ? "hub-nav-item-active" : ""
        }`}
      >
        <UserRound size={18} />
        <span>Profile</span>
      </Link>

      <Link
        href="/hub/settings"
        className={`hub-nav-item ${
          isSettings ? "hub-nav-item-active" : ""
        }`}
      >
        <Settings size={18} />
        <span>Settings</span>
      </Link>
    </nav>
  );
}