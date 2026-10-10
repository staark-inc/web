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
  Search,
  FolderKanban,
  FileText,
  CreditCard,
  LifeBuoy,
  Sparkles,
  Newspaper,
  Package,
  Globe2,
  Layers3,
  ServerCog,
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
  const isProspects = pathname.startsWith("/hub/prospects");
  const isOpportunities = pathname.startsWith("/hub/opportunities");

  const isClients =
    pathname === "/hub/clients" ||
    pathname.startsWith("/hub/clients/");

  const isProjects =
    pathname === "/hub/projects" ||
    pathname.startsWith("/hub/projects/");

  const isOffers =
    pathname === "/hub/offers" ||
    pathname.startsWith("/hub/offers/");

  const isSaas = pathname === "/hub/saas";
  const isSaasSubscriptions =
    pathname === "/hub/saas/subscriptions" ||
    pathname.startsWith("/hub/saas/subscriptions/");
  const isSaasSites =
    pathname === "/hub/saas/sites" ||
    pathname.startsWith("/hub/saas/sites/");
  const isSaasPlans =
    pathname === "/hub/saas/plans" ||
    pathname.startsWith("/hub/saas/plans/");
  const isSaasProvisioning =
    pathname === "/hub/saas/provisioning" ||
    pathname.startsWith("/hub/saas/provisioning/");

  const isBilling =
    pathname === "/hub/billing" ||
    pathname.startsWith("/hub/billing/");

  const isSupport =
    pathname === "/hub/support" ||
    pathname.startsWith("/hub/support/");

  const isUpdates =
    pathname === "/hub/updates" ||
    pathname.startsWith("/hub/updates/");

  return (
    <nav id="hub-navigation" className="hub-nav" aria-label="Hub navigation">
      <Link
        href="/hub"
        aria-label="Overview"
        title="Overview"
        data-tooltip="Overview"
        className={`hub-nav-item hub-compact-tooltip ${
          pathname === "/hub" ? "hub-nav-item-active" : ""
        }`}
      >
        <LayoutDashboard size={17} />
        <span>Overview</span>
      </Link>

      <div className="hub-nav-section-label">Communication</div>

      <Link
        href="/hub/inbox"
        aria-label="Inbox"
        title="Inbox"
        data-tooltip="Inbox"
        className={`hub-nav-item hub-compact-tooltip ${
          isInbox ? "hub-nav-item-active" : ""
        }`}
      >
        <Inbox size={18} />
        <span>Inbox</span>
        {showCounts && unreadCount > 0 && (
          <span className="hub-nav-count">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </Link>

      <Link
        href="/hub/sent"
        aria-label="Sent"
        title="Sent"
        data-tooltip="Sent"
        className={`hub-nav-item hub-compact-tooltip ${
          isSent ? "hub-nav-item-active" : ""
        }`}
      >
        <Send size={18} />
        <span>Sent</span>
      </Link>

      <div className="hub-nav-section-label">Sales</div>

      <Link
        href="/hub/prospects"
        aria-label="Prospects"
        title="Prospects"
        data-tooltip="Prospects"
        className={`hub-nav-item hub-compact-tooltip ${
          isProspects ? "hub-nav-item-active" : ""
        }`}
      >
        <Search size={17} />
        <span>Prospects</span>
      </Link>

      <Link
        href="/hub/leads"
        aria-label="Leads"
        title="Leads"
        data-tooltip="Leads"
        className={`hub-nav-item hub-compact-tooltip ${
          isLeads ? "hub-nav-item-active" : ""
        }`}
      >
        <Target size={17} />
        <span>Leads</span>
        {showCounts && newLeadCount > 0 && (
          <span className="hub-nav-count">{newLeadCount > 99 ? "99+" : newLeadCount}</span>
        )}
      </Link>

      <Link
        href="/hub/opportunities"
        aria-label="Opportunities"
        title="Opportunities"
        data-tooltip="Opportunities"
        className={`hub-nav-item hub-compact-tooltip ${
          isOpportunities ? "hub-nav-item-active" : ""
        }`}
      >
        <Sparkles size={17} />
        <span>Opportunities</span>
      </Link>

      <Link
        href="/hub/clients"
        aria-label="Clients"
        title="Clients"
        data-tooltip="Clients"
        className={`hub-nav-item hub-compact-tooltip ${
          isClients ? "hub-nav-item-active" : ""
        }`}
      >
        <FolderKanban size={17} />
        <span>Clients</span>
      </Link>

      <Link
        href="/hub/contacts"
        aria-label="Contacts"
        title="Contacts"
        data-tooltip="Contacts"
        className={`hub-nav-item hub-compact-tooltip ${
          isContacts ? "hub-nav-item-active" : ""
        }`}
      >
        <UsersRound size={17} />
        <span>Contacts</span>
      </Link>

      <div className="hub-nav-section-label">Delivery</div>

      <Link
        href="/hub/projects"
        aria-label="Projects"
        title="Projects"
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
        title="Offers"
        data-tooltip="Offers"
        className={`hub-nav-item hub-compact-tooltip ${
          isOffers ? "hub-nav-item-active" : ""
        }`}
      >
        <FileText size={17} />
        <span>Offers</span>
      </Link>

      <div className="hub-nav-section-label">SaaS</div>

      <Link
        href="/hub/saas"
        aria-label="SaaS overview"
        title="SaaS overview"
        data-tooltip="SaaS overview"
        className={`hub-nav-item hub-compact-tooltip ${isSaas ? "hub-nav-item-active" : ""}`}
      >
        <LayoutDashboard size={17} />
        <span>Overview</span>
      </Link>

      <Link
        href="/hub/saas/subscriptions"
        aria-label="Subscriptions"
        title="Subscriptions"
        data-tooltip="Subscriptions"
        className={`hub-nav-item hub-compact-tooltip ${
          isSaasSubscriptions ? "hub-nav-item-active" : ""
        }`}
      >
        <Package size={17} />
        <span>Subscriptions</span>
      </Link>

      <Link
        href="/hub/saas/sites"
        aria-label="Sites"
        title="Sites"
        data-tooltip="Sites"
        className={`hub-nav-item hub-compact-tooltip ${isSaasSites ? "hub-nav-item-active" : ""}`}
      >
        <Globe2 size={17} />
        <span>Sites</span>
      </Link>

      <Link
        href="/hub/saas/plans"
        aria-label="Plans"
        title="Plans"
        data-tooltip="Plans"
        className={`hub-nav-item hub-compact-tooltip ${isSaasPlans ? "hub-nav-item-active" : ""}`}
      >
        <Layers3 size={17} />
        <span>Plans</span>
      </Link>

      <Link
        href="/hub/saas/provisioning"
        aria-label="Provisioning"
        title="Provisioning"
        data-tooltip="Provisioning"
        className={`hub-nav-item hub-compact-tooltip ${
          isSaasProvisioning ? "hub-nav-item-active" : ""
        }`}
      >
        <ServerCog size={17} />
        <span>Provisioning</span>
      </Link>

      <div className="hub-nav-section-label">Operations</div>

      <Link
        href="/hub/billing"
        aria-label="Billing"
        title="Billing"
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
        title="Support"
        data-tooltip="Support"
        className={`hub-nav-item hub-compact-tooltip ${
          isSupport ? "hub-nav-item-active" : ""
        }`}
      >
        <LifeBuoy size={17} />
        <span>Support</span>
      </Link>

      <Link
        href="/hub/updates"
        aria-label="News & Updates"
        title="News & Updates"
        data-tooltip="News & Updates"
        className={`hub-nav-item hub-compact-tooltip ${
          isUpdates ? "hub-nav-item-active" : ""
        }`}
      >
        <Newspaper size={17} />
        <span>News & Updates</span>
      </Link>

      <div className="hub-nav-section-label">Account</div>

      <Link
        href="/hub/profile"
        aria-label="Profile"
        title="Profile"
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
        title="Settings"
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
