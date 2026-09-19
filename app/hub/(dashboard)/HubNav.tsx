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