"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronRight, Home } from "lucide-react";

const names: Record<string, string> = {
  inbox: "Inbox", sent: "Sent", compose: "Compose", prospects: "Prospects",
  leads: "Leads", opportunities: "Opportunities", clients: "Clients",
  contacts: "Contacts", projects: "Projects", offers: "Offers",
  saas: "SaaS", subscriptions: "Subscriptions", sites: "Sites",
  plans: "Plans", provisioning: "Provisioning", billing: "Billing",
  support: "Support", updates: "News & Updates", profile: "Profile",
  settings: "Settings", notifications: "Notifications", new: "New",
};

function readable(segment: string) {
  return names[segment] ?? (/^[a-z0-9]{15,}$/i.test(segment) ? "Details" : decodeURIComponent(segment).replaceAll("-", " "));
}

export default function HubWorkspaceHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const current = segments.at(-1);
  const title = current ? readable(current) : "Overview";
  const breadcrumbs = segments.map((segment, index) => ({
    title: readable(segment),
    href: `/hub/${segments.slice(0, index + 1).join("/")}`,
  }));

  return (
    <header className="hub-shell-header hub-shell-header-v4" aria-label="Workspace toolbar">
      <div className="hub-shell-heading hub-shell-heading-v4">
        <nav className="hub-shell-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/hub" aria-label="Hub overview"><Home size={15} aria-hidden="true" /></Link>
          {breadcrumbs.map((crumb, index) => (
            <span className="hub-shell-crumb" key={crumb.href}>
              <ChevronRight size={13} aria-hidden="true" />
              {index === breadcrumbs.length - 1 ? (
                <span aria-current="page">{crumb.title}</span>
              ) : (
                <Link href={crumb.href}>{crumb.title}</Link>
              )}
            </span>
          ))}
          {!breadcrumbs.length && <span className="hub-shell-crumb-current" aria-current="page">Overview</span>}
        </nav>
        <strong className="hub-shell-title">{title}</strong>
      </div>
      <div className="hub-shell-actions hub-shell-actions-v4" aria-label="Quick links">
        <a href="https://staarkinc.com" className="hub-shell-site-link" target="_blank" rel="noopener noreferrer">
          Website <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
