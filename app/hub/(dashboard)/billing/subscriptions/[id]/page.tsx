import type { StaarkEntitlements } from "@/lib/saas/plans";
import { prisma } from "@/lib/prisma";
import { getRuntimeSiteHealth } from "@/lib/saas/runtime-health";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Check,
  CircleDollarSign,
  CreditCard,
  Database,
  Globe2,
  HardDrive,
  KeyRound,
  ServerCog,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PaymentFailureRow = {
  firstFailedAt: Date;
  lastFailedAt: Date;
  graceEndsAt: Date;
  lastInvoiceId: string | null;
  suspendedAt: Date | null;
};

function formatDate(date: Date | null | undefined, withTime = false) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
}

function formatMoney(unitAmountOre: number, currency: string) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(unitAmountOre / 100);
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPlan(planCode: string) {
  if (planCode === "STARTER") return "Starter";
  if (planCode === "SAAS") return "Growth";
  if (planCode === "BUSINESS") return "Business";
  return planCode;
}

function statusTone(status: string) {
  if (status === "ACTIVE" || status === "TRIALING" || status === "CLAIMED") {
    return "good";
  }
  if (status === "PAST_DUE" || status === "CANCELING" || status === "PENDING_SETUP") {
    return "warning";
  }
  if (
    status === "SUSPENDED" ||
    status === "FAILED" ||
    status === "UNPAID" ||
    status === "INCOMPLETE" ||
    status === "INCOMPLETE_EXPIRED"
  ) {
    return "danger";
  }
  return "neutral";
}

function stripeSubscriptionUrl(environment: "TEST" | "LIVE", id: string) {
  return environment === "LIVE"
    ? `https://dashboard.stripe.com/subscriptions/${id}`
    : `https://dashboard.stripe.com/test/subscriptions/${id}`;
}

function stripeCustomerUrl(environment: "TEST" | "LIVE", id: string) {
  return environment === "LIVE"
    ? `https://dashboard.stripe.com/customers/${id}`
    : `https://dashboard.stripe.com/test/customers/${id}`;
}

function humanValue(value: boolean | number | string) {
  if (typeof value === "boolean") return value ? "Enabled" : "Not included";
  if (typeof value === "number") return String(value);
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function EntitlementValue({ value }: { value: boolean | number | string }) {
  const enabled = value !== false && value !== "none" && value !== 0;

  return (
    <span className={enabled ? "hub-saas-detail-value-enabled" : "hub-saas-detail-value-disabled"}>
      {enabled ? <Check size={12} /> : <X size={12} />}
      {humanValue(value)}
    </span>
  );
}

export default async function SaaSSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const subscription = await prisma.billingSubscription.findUnique({
    where: { id },
    select: {
      id: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      stripeProductId: true,
      environment: true,
      planCode: true,
      interval: true,
      currency: true,
      unitAmountOre: true,
      taxBehavior: true,
      status: true,
      cancelAtPeriodEnd: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      trialStart: true,
      trialEnd: true,
      canceledAt: true,
      endedAt: true,
      entitlements: true,
      createdAt: true,
      updatedAt: true,
      billingCustomer: {
        select: {
          stripeCustomerId: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          billingEmail: true,
          phone: true,
          organizationNumber: true,
        },
      },
      provisioning: {
        select: {
          id: true,
          status: true,
          planCode: true,
          requestedAt: true,
          claimedAt: true,
          activatedAt: true,
          failedAt: true,
          lastError: true,
          updatedAt: true,

          nextSiteId: true,
          nextSiteKey: true,
          nextHostname: true,
          nextSiteUrl: true,
          nextProvisionedAt: true,

          setupClaims: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              hint: true,
              expiresAt: true,
              usedAt: true,
              revokedAt: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!subscription) notFound();

  const paymentFailures = await prisma.$queryRaw<PaymentFailureRow[]>`
    SELECT
      "firstFailedAt",
      "lastFailedAt",
      "graceEndsAt",
      "lastInvoiceId",
      "suspendedAt"
    FROM "SaasPaymentFailureState"
    WHERE "billingSubscriptionId" = ${subscription.id}
    LIMIT 1
  `;

  const failure = paymentFailures[0] ?? null;
  const entitlements = subscription.entitlements as unknown as StaarkEntitlements;
  const provisioning = subscription.provisioning;

  const runtimeHealth =
    await getRuntimeSiteHealth(
      provisioning?.nextSiteId,
    );

  const claimedAt =
    provisioning?.claimedAt ??
    provisioning?.setupClaims.find(
      (claim) => claim.usedAt instanceof Date,
    )?.usedAt ??
    null;

  const intervalLabel = subscription.interval === "MONTH" ? "month" : "year";

  const lifecycle = [
    { label: "Subscription created", date: subscription.createdAt },
    { label: "Trial started", date: subscription.trialStart },
    { label: "Provisioning requested", date: provisioning?.requestedAt },
    { label: "Setup claimed", date: claimedAt },
    { label: "Site activated", date: provisioning?.activatedAt },
    { label: "Current period started", date: subscription.currentPeriodStart },
    { label: "Payment failure detected", date: failure?.firstFailedAt },
    { label: "Suspended by Staark", date: failure?.suspendedAt },
    { label: "Cancellation recorded", date: subscription.canceledAt },
    { label: "Subscription ended", date: subscription.endedAt },
  ]
    .filter((item): item is { label: string; date: Date } => item.date instanceof Date)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="hub-page hub-saas-detail-page">
      <header className="hub-saas-detail-head">
        <div>
          <Link href="/hub/billing/subscriptions" className="hub-saas-detail-back">
            <ArrowLeft size={13} />
            Subscriptions
          </Link>
          <span className="hub-workspace-kicker">BILLING / SAAS / SUBSCRIPTION</span>
          <div className="hub-saas-detail-title-line">
            <h1>{subscription.client.name}</h1>
            <span className={`hub-saas-chip hub-saas-chip-${statusTone(subscription.status)}`}>
              {formatStatus(subscription.status)}
            </span>
            <span className={`hub-saas-environment hub-saas-environment-${subscription.environment.toLowerCase()}`}>
              {subscription.environment}
            </span>
          </div>
          <p>
            {formatPlan(subscription.planCode)} · {formatMoney(subscription.unitAmountOre, subscription.currency)} / {intervalLabel}
          </p>
        </div>

        <div className="hub-saas-detail-head-actions">
          <Link href={`/hub/clients/${subscription.client.id}`} className="hub-secondary-button">
            <Building2 size={14} />
            Client
          </Link>
          <a
            href={stripeSubscriptionUrl(subscription.environment, subscription.stripeSubscriptionId)}
            target="_blank"
            rel="noreferrer"
            className="hub-workspace-primary-action"
          >
            Stripe
            <ArrowUpRight size={13} />
          </a>
        </div>
      </header>

      <section className="hub-saas-detail-stats" aria-label="Subscription overview">
        <div>
          <span><CircleDollarSign size={14} /> Plan</span>
          <strong>{formatPlan(subscription.planCode)}</strong>
          <small>{formatMoney(subscription.unitAmountOre, subscription.currency)} / {intervalLabel}</small>
        </div>
        <div>
          <span><Activity size={14} /> Billing status</span>
          <strong>{formatStatus(subscription.status)}</strong>
          <small>{subscription.cancelAtPeriodEnd ? "Ends at period end" : "Recurring"}</small>
        </div>
        <div>
          <span><CalendarClock size={14} /> Period end</span>
          <strong>{formatDate(subscription.currentPeriodEnd)}</strong>
          <small>{subscription.trialEnd ? `Trial ${formatDate(subscription.trialEnd)}` : "No active trial"}</small>
        </div>
        <div>
          <span><ServerCog size={14} /> Provisioning</span>
          <strong>{provisioning ? formatStatus(provisioning.status) : "Not created"}</strong>
          <small>
            {provisioning?.nextHostname ??
              "Awaiting runtime binding"}
          </small>
        </div>
      </section>

      <div className="hub-saas-detail-grid">
        <div className="hub-saas-detail-column">
          <section className="hub-saas-detail-panel">
            <div className="hub-saas-detail-panel-head">
              <div>
                <span>01 / CUSTOMER</span>
                <h2>Client & billing identity</h2>
              </div>
              <Building2 size={17} />
            </div>
            <div className="hub-saas-detail-kv-grid">
              <div><small>Client</small><Link href={`/hub/clients/${subscription.client.id}`}>{subscription.client.name}</Link></div>
              <div><small>Billing email</small><strong>{subscription.client.billingEmail ?? "—"}</strong></div>
              <div><small>Phone</small><strong>{subscription.client.phone ?? "—"}</strong></div>
              <div><small>Organization no.</small><strong>{subscription.client.organizationNumber ?? "—"}</strong></div>
            </div>
          </section>

          <section className="hub-saas-detail-panel">
            <div className="hub-saas-detail-panel-head">
              <div>
                <span>02 / WEBSITE SETUP</span>
                <h2>Staark Next provisioning</h2>
              </div>
              <Globe2 size={17} />
            </div>

            {provisioning?.nextSiteId ? (
              <>
                <div className="hub-saas-detail-context-list">
                  <p>
                    <strong>Runtime</strong>
                    <span>
                      {!runtimeHealth?.reachable
                        ? "Offline"
                        : runtimeHealth.ok
                          ? "Online"
                          : "Degraded"}
                    </span>
                  </p>

                  <p>
                    <strong>Database</strong>
                    <span>
                      {runtimeHealth?.database?.ok
                        ? "Healthy"
                        : "Unavailable"}
                    </span>
                  </p>

                  <p>
                    <strong>Tenant</strong>
                    <span>
                      {runtimeHealth?.site?.exists
                        ? "Resolved"
                        : "Missing"}
                    </span>
                  </p>

                  <p>
                    <strong>Setup</strong>
                    <span>
                      {runtimeHealth?.site?.setupCompleted
                        ? "Complete"
                        : "Incomplete"}
                    </span>
                  </p>

                  <p>
                    <strong>Hostname</strong>
                    <span>
                      {runtimeHealth?.site?.domains?.find(
                        (domain) => domain.primaryDomain,
                      )?.hostname ??
                        provisioning.nextHostname ??
                        "—"}
                    </span>
                  </p>

                  <p>
                    <strong>Public access</strong>
                    <span>
                      {runtimeHealth?.site?.publicAccess === false
                        ? "Blocked"
                        : runtimeHealth?.site?.publicAccess === true
                          ? "Online"
                          : "—"}
                    </span>
                  </p>

                  <p>
                    <strong>Reserved until</strong>
                    <span>
                      {runtimeHealth?.site?.domains?.find(
                        (domain) => domain.primaryDomain,
                      )?.releaseAt
                        ? formatDate(
                            new Date(
                              runtimeHealth.site.domains.find(
                                (domain) => domain.primaryDomain,
                              )!.releaseAt!,
                            ),
                            true,
                          )
                        : "—"}
                    </span>
                  </p>

                  <p>
                    <strong>Pages</strong>
                    <span>
                      {runtimeHealth?.site?.pageCount ?? "—"}
                    </span>
                  </p>

                  <p>
                    <strong>Runtime version</strong>
                    <span>
                      {runtimeHealth?.runtime?.releaseVersion ??
                        "—"}
                    </span>
                  </p>

                  <p>
                    <strong>Last checked</strong>
                    <span>
                      {runtimeHealth?.checkedAt
                        ? formatDate(
                            new Date(runtimeHealth.checkedAt),
                            true,
                          )
                        : "—"}
                    </span>
                  </p>
                </div>

                {provisioning.nextSiteUrl ? (
                  <a
                    href={provisioning.nextSiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hub-secondary-button"
                  >
                    <Globe2 size={14} />
                    Open website
                    <ArrowUpRight size={12} />
                  </a>
                ) : null}
              </>
            ) : (
              <div className="hub-saas-detail-empty-inline">
                <ServerCog size={18} />
                <span>
                  Runtime site has not been provisioned yet.
                </span>
              </div>
            )}
          </section>

          <section className="hub-saas-detail-panel">
            <div className="hub-saas-detail-panel-head">
              <div>
                <span>03 / ENTITLEMENTS</span>
                <h2>Subscription access snapshot</h2>
              </div>
              <Sparkles size={17} />
            </div>

            <div className="hub-saas-entitlement-grid">
              <div><small>Websites</small><EntitlementValue value={entitlements.website.max} /></div>
              <div><small>Custom domain</small><EntitlementValue value={entitlements.website.customDomain} /></div>
              <div><small>Storage</small><span>{entitlements.hosting.storageGb} GB</span></div>
              <div><small>SSL</small><EntitlementValue value={entitlements.hosting.ssl} /></div>
              <div><small>Backups</small><span>{entitlements.backups.retentionDays} days</span></div>
              <div><small>Security</small><EntitlementValue value={entitlements.security} /></div>
              <div><small>Performance</small><EntitlementValue value={entitlements.performance} /></div>
              <div><small>SEO</small><EntitlementValue value={entitlements.seo} /></div>
              <div><small>Search Console</small><EntitlementValue value={entitlements.integrations.searchConsole} /></div>
              <div><small>Analytics</small><EntitlementValue value={entitlements.integrations.analytics} /></div>
              <div><small>Business Profile</small><EntitlementValue value={entitlements.integrations.businessProfile} /></div>
              <div><small>Leads</small><EntitlementValue value={entitlements.leads.enabled} /></div>
              <div><small>Reports</small><EntitlementValue value={entitlements.reports} /></div>
              <div><small>Automations</small><EntitlementValue value={entitlements.automations} /></div>
              <div><small>CRM</small><EntitlementValue value={entitlements.crm.enabled} /></div>
              <div><small>Client management</small><EntitlementValue value={entitlements.crm.clientManagement} /></div>
              <div><small>Team</small><EntitlementValue value={entitlements.team.enabled} /></div>
              <div><small>Support</small><EntitlementValue value={entitlements.support} /></div>
            </div>
          </section>
        </div>

        <aside className="hub-saas-detail-column">
          <section className="hub-saas-detail-panel">
            <div className="hub-saas-detail-panel-head">
              <div>
                <span>04 / BILLING HEALTH</span>
                <h2>Payment state</h2>
              </div>
              {failure ? <AlertTriangle size={17} /> : <ShieldCheck size={17} />}
            </div>
            <div className="hub-saas-detail-context-list">
              <p><strong>Health</strong><span>{failure ? "Payment issue recorded" : "Healthy"}</span></p>
              <p><strong>First failure</strong><span>{formatDate(failure?.firstFailedAt, true)}</span></p>
              <p><strong>Last failure</strong><span>{formatDate(failure?.lastFailedAt, true)}</span></p>
              <p><strong>Grace ends</strong><span>{formatDate(failure?.graceEndsAt, true)}</span></p>
              <p><strong>Suspended</strong><span>{formatDate(failure?.suspendedAt, true)}</span></p>
              <p><strong>Invoice</strong><span>{failure?.lastInvoiceId ?? "—"}</span></p>
            </div>
          </section>

          <section className="hub-saas-detail-panel">
            <div className="hub-saas-detail-panel-head">
              <div>
                <span>05 / STRIPE</span>
                <h2>Billing references</h2>
              </div>
              <CreditCard size={17} />
            </div>
            <div className="hub-saas-detail-reference-list">
              <div>
                <small>Customer</small>
                <code>{subscription.billingCustomer.stripeCustomerId}</code>
                <a href={stripeCustomerUrl(subscription.environment, subscription.billingCustomer.stripeCustomerId)} target="_blank" rel="noreferrer">Open <ArrowUpRight size={11} /></a>
              </div>
              <div>
                <small>Subscription</small>
                <code>{subscription.stripeSubscriptionId}</code>
                <a href={stripeSubscriptionUrl(subscription.environment, subscription.stripeSubscriptionId)} target="_blank" rel="noreferrer">Open <ArrowUpRight size={11} /></a>
              </div>
              <div><small>Price</small><code>{subscription.stripePriceId}</code></div>
              <div><small>Product</small><code>{subscription.stripeProductId ?? "—"}</code></div>
              <div><small>Tax behavior</small><code>{subscription.taxBehavior}</code></div>
            </div>
          </section>

          <section className="hub-saas-detail-panel">
            <div className="hub-saas-detail-panel-head">
              <div>
                <span>06 / PROVISIONING</span>
                <h2>Setup state</h2>
              </div>
              <ServerCog size={17} />
            </div>
            {provisioning ? (
              <>
                <div className="hub-saas-detail-context-list">
                  <p><strong>Status</strong><span>{formatStatus(provisioning.status)}</span></p>
                  <p><strong>Requested</strong><span>{formatDate(provisioning.requestedAt, true)}</span></p>
                  <p><strong>Claimed</strong><span>{formatDate(claimedAt, true)}</span></p>
                  <p><strong>Activated</strong><span>{formatDate(provisioning.activatedAt, true)}</span></p>
                  <p><strong>Failed</strong><span>{formatDate(provisioning.failedAt, true)}</span></p>
                  <p><strong>Last error</strong><span>{provisioning.lastError ?? "—"}</span></p>
                </div>

                {provisioning.setupClaims.length > 0 && (
                  <div className="hub-saas-detail-claims">
                    <small>Recent setup claims</small>
                    {provisioning.setupClaims.map((claim) => (
                      <div key={claim.id}>
                        <KeyRound size={12} />
                        <code>{claim.hint}</code>
                        <span>
                          {claim.usedAt
                            ? `Used ${formatDate(claim.usedAt, true)}`
                            : claim.revokedAt
                              ? `Revoked ${formatDate(claim.revokedAt, true)}`
                              : `Expires ${formatDate(claim.expiresAt, true)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="hub-saas-detail-empty-inline">
                <ServerCog size={18} />
                <span>No provisioning record exists for this subscription.</span>
              </div>
            )}
          </section>

          <section className="hub-saas-detail-panel">
            <div className="hub-saas-detail-panel-head">
              <div>
                <span>07 / LIFECYCLE</span>
                <h2>Recorded milestones</h2>
              </div>
              <Database size={17} />
            </div>
            {lifecycle.length === 0 ? (
              <div className="hub-saas-detail-empty-inline">No lifecycle milestones recorded.</div>
            ) : (
              <div className="hub-saas-detail-timeline">
                {lifecycle.map((item) => (
                  <div key={`${item.label}-${item.date.toISOString()}`}>
                    <span />
                    <div>
                      <strong>{item.label}</strong>
                      <time dateTime={item.date.toISOString()}>{formatDate(item.date, true)}</time>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <footer className="hub-saas-detail-footnote">
        <HardDrive size={13} />
        Hub is the internal operations view. Customer-facing SaaS administration remains a separate product surface.
      </footer>
    </div>
  );
}
