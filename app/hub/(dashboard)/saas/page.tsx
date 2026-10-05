import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CreditCard,
  Globe2,
  Layers3,
  ServerCog,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SaaSOverviewPage() {
  const [subscriptions, provisionings] = await Promise.all([
    prisma.billingSubscription.findMany({
      select: {
        id: true,
        status: true,
        environment: true,
        planCode: true,
      },
    }),
    prisma.saasProvisioning.findMany({
      select: {
        id: true,
        status: true,
        nextSiteId: true,
        nextHostname: true,
      },
    }),
  ]);

  const activeSubscriptions = subscriptions.filter(
    (item) => item.status === "ACTIVE" || item.status === "TRIALING",
  ).length;
  const liveSubscriptions = subscriptions.filter((item) => item.environment === "LIVE").length;
  const activeSites = provisionings.filter(
    (item) => item.status === "ACTIVE" && item.nextSiteId,
  ).length;
  const provisioningAttention = provisionings.filter(
    (item) => item.status === "FAILED" || item.status === "PENDING_SETUP",
  ).length;

  const workspaces = [
    {
      href: "/hub/saas/subscriptions",
      icon: CreditCard,
      title: "Subscriptions",
      description: "Stripe subscriptions, lifecycle, payment health and customer access.",
      value: activeSubscriptions,
      meta: `${liveSubscriptions} live subscription${liveSubscriptions === 1 ? "" : "s"}`,
    },
    {
      href: "/hub/saas/sites",
      icon: Globe2,
      title: "Sites",
      description: "Provisioned tenant websites, hostnames and runtime bindings.",
      value: activeSites,
      meta: "active runtime sites",
    },
    {
      href: "/hub/saas/plans",
      icon: Layers3,
      title: "Plans",
      description: "Starter, Growth and Business entitlements in one reference view.",
      value: 3,
      meta: "product plans",
    },
    {
      href: "/hub/saas/provisioning",
      icon: ServerCog,
      title: "Provisioning",
      description: "Setup state, failed jobs and pending tenant activation.",
      value: provisionings.length,
      meta: `${provisioningAttention} need attention`,
    },
  ];

  return (
    <div className="hub-page">
      <header className="hub-workspace-head">
        <div>
          <span className="hub-workspace-kicker">SAAS / CONTROL PLANE</span>
          <h1>SaaS</h1>
          <p>
            Internal operations for subscriptions, tenant sites, product plans and provisioning.
          </p>
        </div>
      </header>

      <section className="hub-workspace-stats" aria-label="SaaS overview">
        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-good">
            <Activity size={16} />
          </span>
          <div>
            <small>Healthy subscriptions</small>
            <strong>{activeSubscriptions}</strong>
            <span>Active or trialing</span>
          </div>
        </div>
        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon">
            <Globe2 size={16} />
          </span>
          <div>
            <small>Active sites</small>
            <strong>{activeSites}</strong>
            <span>Provisioned runtimes</span>
          </div>
        </div>
        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon">
            <CreditCard size={16} />
          </span>
          <div>
            <small>Live subscriptions</small>
            <strong>{liveSubscriptions}</strong>
            <span>Stripe live mode</span>
          </div>
        </div>
        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon">
            <ServerCog size={16} />
          </span>
          <div>
            <small>Provisioning attention</small>
            <strong>{provisioningAttention}</strong>
            <span>Pending or failed</span>
          </div>
        </div>
      </section>

      <section className="hub-billing-v2-list" aria-label="SaaS workspaces">
        {workspaces.map((workspace) => {
          const Icon = workspace.icon;
          return (
            <article key={workspace.href} className="hub-billing-v2-row">
              <div className="hub-billing-v2-main">
                <span className="hub-billing-v2-icon"><Icon size={16} /></span>
                <div>
                  <Link href={workspace.href}>{workspace.title}</Link>
                  <span>{workspace.description}</span>
                </div>
              </div>
              <div className="hub-billing-v2-terms">
                <small>Status</small>
                <strong>{workspace.value}</strong>
                <span>{workspace.meta}</span>
              </div>
              <div className="hub-billing-v2-tail">
                <Link href={workspace.href}>Open <ArrowRight size={13} /></Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
