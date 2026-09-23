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
  showCounts: boolean;
};

export default function HubNav({
  unreadCount,
  newLeadCount,
  showCounts,
}: HubNavProps) {
  const pathname = usePathname();

  const isInbox =
    pathname === "/hub/inbox" ||
    pathname.startsWith("/hub/message/") ||
    pathname.startsWith("/hub/thread/");

  const isSent = pathname.startsWith("/hub/sent");
  const isProfile = pathname.startsWith("/hub/profile");
  const isSettings = pathname.startsWith("/hub/settings");
  const isContacts = pathname.startsWith("/hub/contacts");
  const isLeads = pathname.startsWith("/hub/leads");

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
        aria-label="Overview"
        data-tooltip="Overview"
        className={`hub-nav-item hub-compact-tooltip ${
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
        aria-label="Inbox"
        data-tooltip="Inbox"
        className={`hub-nav-item hub-compact-tooltip ${
          isInbox ? "hub-nav-item-active" : ""
        }`}
      >
        <Inbox size={18} />
        <span>Inbox</span>

        {showCounts && unreadCount > 0 && (
          <span className="hub-nav-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      <Link
        href="/hub/sent"
        aria-label="Sent"
        data-tooltip="Sent"
        className={`hub-nav-item hub-compact-tooltip ${
          isSent ? "hub-nav-item-active" : ""
        }`}
      >
        <Send size={18} />
        <span>Sent</span>
      </Link>

      <div className="hub-nav-section-label">Customers</div>

      <Link
        href="/hub/contacts"
        aria-label="Contacts"
        data-tooltip="Contacts"
        className={`hub-nav-item hub-compact-tooltip ${
          isContacts ? "hub-nav-item-active" : ""
        }`}
      >
        <UsersRound size={17} />
        <span>Contacts</span>
      </Link>

      <Link
        href="/hub/leads"
        aria-label="Leads"
        data-tooltip="Leads"
        className={`hub-nav-item hub-compact-tooltip ${
          isLeads ? "hub-nav-item-active" : ""
        }`}
      >
        <Target size={17} />
        <span>Leads</span>
        {showCounts && newLeadCount > 0 && (
          <span className="hub-nav-count">
            {newLeadCount > 99 ? "99+" : newLeadCount}
          </span>
        )}
      </Link>

      <Link
        href="/hub/clients"
        aria-label="Clients"
        data-tooltip="Clients"
        className={`hub-nav-item hub-compact-tooltip ${
          isClients ? "hub-nav-item-active" : ""
        }`}
      >
        <FolderKanban size={17} />
        <span>Clients</span>
      </Link>

      <div className="hub-nav-section-label">Work</div>

      <Link
        href="/hub/projects"
        aria-label="Projects"
        data-tooltip="Projects"
        className={`hub-nav-item hub-compact-tooltip ${
          isProjects ? "hub-nav-item-active" : ""
        }`}
      >
        <FolderKanban size={17} />
        <span>Projects</span>
      </Link>

      <Link
        href="/hub/offers"
        aria-label="Offers"
        data-tooltip="Offers"
        className={`hub-nav-item hub-compact-tooltip ${
          isOffers ? "hub-nav-item-active" : ""
        }`}
      >
        <FileText size={17} />
        <span>Offers</span>
      </Link>

      <div className="hub-nav-section-label">Operations</div>

      <Link
        href="/hub/billing"
        aria-label="Billing"
        data-tooltip="Billing"
        className={`hub-nav-item hub-compact-tooltip ${
          isBilling ? "hub-nav-item-active" : ""
        }`}
      >
        <CreditCard size={17} />
        <span>Billing</span>
      </Link>

      <Link
        href="/hub/support"
        aria-label="Support"
        data-tooltip="Support"
        className={`hub-nav-item hub-compact-tooltip ${
          isSupport ? "hub-nav-item-active" : ""
        }`}
      >
        <LifeBuoy size={17} />
        <span>Support</span>
      </Link>

      <div className="hub-nav-section-label">Account</div>

      <Link
        href="/hub/profile"
        aria-label="Profile"
        data-tooltip="Profile"
        className={`hub-nav-item hub-compact-tooltip ${
          isProfile ? "hub-nav-item-active" : ""
        }`}
      >
        <UserRound size={18} />
        <span>Profile</span>
      </Link>

      <Link
        href="/hub/settings"
        aria-label="Settings"
        data-tooltip="Settings"
        className={`hub-nav-item hub-compact-tooltip ${
          isSettings ? "hub-nav-item-active" : ""
        }`}
      >
        <Settings size={18} />
        <span>Settings</span>
      </Link>
    </nav>
  );
}
