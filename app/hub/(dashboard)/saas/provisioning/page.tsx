import Link from "next/link";
import { AlertTriangle, ArrowRight, ServerCog } from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatStatus(status: string) {
  return status.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function SaaSProvisioningPage() {
  const rows = await prisma.saasProvisioning.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      environment: true,
      planCode: true,
      requestedAt: true,
      claimedAt: true,
      activatedAt: true,
      failedAt: true,
      lastError: true,
      nextHostname: true,
      billingSubscriptionId: true,
      client: { select: { name: true } },
    },
  });

  const attention = rows.filter((row) => row.status === "FAILED" || row.status === "PENDING_SETUP").length;

  return (
    <div className="hub-page">
      <header className="hub-workspace-head">
        <div>
          <span className="hub-workspace-kicker">SAAS / PROVISIONING</span>
          <h1>Provisioning</h1>
          <p>Tenant setup lifecycle from subscription to activated runtime site.</p>
        </div>
      </header>

      <section className="hub-workspace-stats" aria-label="Provisioning overview">
        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon"><ServerCog size={16} /></span>
          <div><small>Total</small><strong>{rows.length}</strong><span>Provisioning records</span></div>
        </div>
        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon"><AlertTriangle size={16} /></span>
          <div><small>Needs attention</small><strong>{attention}</strong><span>Pending or failed</span></div>
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="hub-empty-state">
          <ServerCog size={28} />
          <h2>No provisioning records yet</h2>
          <p>Provisioning starts after a SaaS subscription is created.</p>
        </div>
      ) : (
        <section className="hub-billing-v2-list" aria-label="Provisioning records">
          {rows.map((row) => (
            <article key={row.id} className="hub-billing-v2-row">
              <div className="hub-billing-v2-main">
                <span className="hub-billing-v2-icon"><ServerCog size={16} /></span>
                <div>
                  <Link href={`/hub/saas/subscriptions/${row.billingSubscriptionId}`}>{row.client.name}</Link>
                  <span>{row.nextHostname ?? "Hostname not assigned"}</span>
                  <small>{row.environment} · {row.planCode === "SAAS" ? "Growth" : formatStatus(row.planCode)}</small>
                </div>
              </div>
              <div className="hub-billing-v2-terms">
                <small>Status</small>
                <strong>{formatStatus(row.status)}</strong>
                <span>Requested {formatDate(row.requestedAt)}</span>
              </div>
              <div className="hub-billing-v2-project">
                <small>Lifecycle</small>
                <strong>{row.activatedAt ? "Activated" : row.claimedAt ? "Claimed" : "Awaiting claim"}</strong>
                <span>{row.failedAt ? `Failed ${formatDate(row.failedAt)}` : row.lastError ?? "No error"}</span>
              </div>
              <div className="hub-billing-v2-tail">
                <Link href={`/hub/saas/subscriptions/${row.billingSubscriptionId}`}>
                  Details <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
