import Link from "next/link";
import { ArrowRight, Globe2, ServerCog } from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatStatus(status: string) {
  return status.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default async function SaaSSitesPage() {
  const sites = await prisma.saasProvisioning.findMany({
    where: { nextSiteId: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      nextSiteId: true,
      nextHostname: true,
      nextSiteUrl: true,
      nextProvisionedAt: true,
      planCode: true,
      billingSubscriptionId: true,
      client: { select: { name: true } },
    },
  });

  return (
    <div className="hub-page">
      <header className="hub-workspace-head">
        <div>
          <span className="hub-workspace-kicker">SAAS / SITES</span>
          <h1>Sites</h1>
          <p>Provisioned tenant websites and their runtime bindings.</p>
        </div>
        <Link href="/hub/saas" className="hub-secondary-button">SaaS overview</Link>
      </header>

      {sites.length === 0 ? (
        <div className="hub-empty-state">
          <Globe2 size={28} />
          <h2>No provisioned sites yet</h2>
          <p>Sites appear here after SaaS provisioning creates a runtime tenant.</p>
        </div>
      ) : (
        <section className="hub-billing-v2-list" aria-label="SaaS sites">
          {sites.map((site) => (
            <article key={site.id} className="hub-billing-v2-row">
              <div className="hub-billing-v2-main">
                <span className="hub-billing-v2-icon"><Globe2 size={16} /></span>
                <div>
                  <strong>{site.client.name}</strong>
                  <span>{site.nextHostname ?? "Hostname not assigned"}</span>
                  <small>{site.nextSiteId}</small>
                </div>
              </div>
              <div className="hub-billing-v2-terms">
                <small>Plan</small>
                <strong>{site.planCode === "SAAS" ? "Growth" : formatStatus(site.planCode)}</strong>
                <span>{formatStatus(site.status)}</span>
              </div>
              <div className="hub-billing-v2-project">
                <small>Runtime</small>
                <strong>{site.nextSiteUrl ? "Bound" : "Pending URL"}</strong>
                <span>{site.nextProvisionedAt ? "Provisioned" : "Awaiting provisioning"}</span>
              </div>
              <div className="hub-billing-v2-tail">
                <Link href={`/hub/saas/subscriptions/${site.billingSubscriptionId}`}>
                  Subscription <ArrowRight size={13} />
                </Link>
                {site.nextSiteUrl ? (
                  <a href={site.nextSiteUrl} target="_blank" rel="noreferrer">Open site</a>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
