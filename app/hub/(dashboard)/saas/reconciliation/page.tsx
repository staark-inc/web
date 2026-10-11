import Link from "next/link";
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, HelpCircle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getRuntimeSiteHealth } from "@/lib/saas/runtime-health";
import { reconcileSite } from "@/lib/saas/site-reconciliation";

export const dynamic = "force-dynamic";

export default async function SaaSReconciliationPage() {
  // Cap checks so a dashboard request cannot fan out indefinitely.
  const rows = await prisma.saasProvisioning.findMany({
    where: { nextSiteId: { not: null } },
    take: 30,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      nextSiteId: true,
      nextHostname: true,
      billingSubscriptionId: true,
      client: { select: { name: true } },
    },
  });

  const results = [];
  // Bounded sequential reads avoid bursts to the shared runtime service.
  for (const row of rows) {
    const health = await getRuntimeSiteHealth(row.nextSiteId);
    const result = reconcileSite(
      { siteId: row.nextSiteId ?? "", hostname: row.nextHostname },
      health,
    );
    results.push({ ...row, result });
  }

  const drift = results.filter((row) => row.result.state === "drift").length;
  const unavailable = results.filter((row) => row.result.state === "unavailable").length;
  const matched = results.filter((row) => row.result.state === "matched").length;

  return (
    <div className="hub-page hub-saas-workspace-page sw-saas-detail-page">
      <header className="hub-workspace-head">
        <div>
          <span className="hub-workspace-kicker">SAAS / READ-ONLY AUDIT</span>
          <h1>Runtime reconciliation</h1>
          <p>Compare known Hub site bindings against signed runtime health responses. No changes are made.</p>
        </div>
        <Link href="/hub/saas" className="hub-secondary-button"><ArrowLeft size={15} /> SaaS overview</Link>
      </header>
      <section className="hub-workspace-stats" aria-label="Reconciliation summary">
        {[
          { label: "Matched", value: matched, icon: CheckCircle2 },
          { label: "Drift", value: drift, icon: AlertTriangle },
          { label: "Unavailable", value: unavailable, icon: HelpCircle },
          { label: "Checked", value: results.length, icon: Activity },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div className="hub-workspace-stat" key={item.label}>
              <span className="hub-workspace-stat-icon"><Icon size={16} /></span>
              <div><small>{item.label}</small><strong>{item.value}</strong><span>Read-only snapshot</span></div>
            </div>
          );
        })}
      </section>
      <p className="hub-workspace-kicker">Checking the 30 most recently updated bound sites. Unreachable sites are not classified as drift. Unbound or runtime-only sites are not discovered in this phase.</p>
      {results.length === 0 ? (
        <div className="hub-empty-state"><Activity size={28} /><h2>No bound sites</h2><p>There are no runtime site IDs to verify.</p></div>
      ) : (
        <section className="sw-saas-detail-grid" aria-label="Runtime comparisons">
          {results.map((row) => (
            <article key={row.id} className="hub-billing-v2-row sw-saas-data-card">
              <div className="hub-billing-v2-main">
                <span className="hub-billing-v2-icon"><Activity size={16} /></span>
                <div><strong>{row.client.name}</strong><span>{row.nextHostname ?? "Hostname missing"}</span><small>{row.nextSiteId}</small></div>
              </div>
              <div className="hub-billing-v2-terms">
                <small>Result</small>
                <strong>{row.result.state}</strong>
                {row.result.findings.map((finding) => <span key={finding}>{finding}</span>)}
              </div>
              <div className="hub-billing-v2-tail">
                <Link href={`/hub/saas/subscriptions/${row.billingSubscriptionId}`}>Subscription</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
