import Link from "next/link";
import { ArrowLeft, Globe2, AlertTriangle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { classifyInventory, fetchRuntimeInventory } from "@/lib/saas/runtime-inventory";

export const dynamic = "force-dynamic";

export default async function SaaSDiscoveryPage() {
  const [inventory, hub] = await Promise.all([
    fetchRuntimeInventory(),
    prisma.saasProvisioning.findMany({
      where: { nextSiteId: { not: null } },
      select: { nextSiteId: true, nextHostname: true, client: { select: { name: true } } },
    }),
  ]);
  const known = new Set(hub.map((row) => row.nextSiteId).filter((id): id is string => !!id));
  const observed = inventory.ok ? classifyInventory(inventory.sites, known) : [];
  const registered = observed.filter((row) => row.state === "registered");
  const runtimeOnly = observed.filter((row) => row.state === "runtime_only");
  const hubOnly = inventory.ok ? hub.filter((row) => row.nextSiteId && !inventory.sites.some((site) => site.id === row.nextSiteId)) : [];

  return (
    <div className="hub-page hub-saas-workspace-page sw-saas-detail-page">
      <header className="hub-workspace-head">
        <div>
          <span className="hub-workspace-kicker">SAAS / READ-ONLY DISCOVERY</span>
          <h1>Runtime site discovery</h1>
          <p>Inventory the internal runtime and compare its site IDs to known Hub bindings. No changes are made.</p>
        </div>
        <Link href="/hub/saas" className="hub-secondary-button"><ArrowLeft size={15}/> SaaS overview</Link>
      </header>
      {!inventory.ok ? (
        <div className="hub-empty-state">
          <AlertTriangle size={28} />
          <h2>Runtime inventory unavailable</h2>
          <p>{inventory.reason} Hub-only sites cannot be established until a complete inventory is received.</p>
        </div>
      ) : (
        <>
          <section className="hub-workspace-stats" aria-label="Discovery results">
            {[
              ["Runtime sites", inventory.sites.length],
              ["Registered", registered.length],
              ["Runtime only", runtimeOnly.length],
              ["Hub only", hubOnly.length],
            ].map(([label, value]) => (
              <div className="hub-workspace-stat" key={label}>
                <span className="hub-workspace-stat-icon"><Globe2 size={16}/></span>
                <div><small>{label}</small><strong>{value}</strong><span>Complete read-only inventory</span></div>
              </div>
            ))}
          </section>
          {observed.length === 0 && hubOnly.length === 0 ? (
            <div className="hub-empty-state"><Globe2 size={28}/><h2>No runtime sites</h2><p>Runtime inventory completed with no registered sites.</p></div>
          ) : (
            <section className="sw-saas-detail-grid" aria-label="Discovered runtime sites">
              {observed.map(({ site, state }) => (
                <article className="hub-billing-v2-row sw-saas-data-card" key={site.id}>
                  <div className="hub-billing-v2-main">
                    <span className="hub-billing-v2-icon"><Globe2 size={16}/></span>
                    <div><strong>{site.key}</strong><span>{site.domains.map((d) => d.hostname).join(", ") || "No domains"}</span><small>{site.id}</small></div>
                  </div>
                  <div className="hub-billing-v2-terms"><small>Classification</small><strong>{state === "runtime_only" ? "Runtime only — review" : "Registered"}</strong><span>{site.setupCompleted ? "Setup complete" : "Setup incomplete"}</span></div>
                </article>
              ))}
              {hubOnly.map((row) => (
                <article className="hub-billing-v2-row sw-saas-data-card" key={row.nextSiteId}>
                  <div className="hub-billing-v2-main"><span className="hub-billing-v2-icon"><AlertTriangle size={16}/></span><div><strong>{row.client.name}</strong><span>{row.nextHostname ?? "No hostname"}</span><small>{row.nextSiteId}</small></div></div>
                  <div className="hub-billing-v2-terms"><small>Classification</small><strong>Hub only — review</strong><span>Not present in complete runtime inventory</span></div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
