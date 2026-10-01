import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CreditCard,
  FlaskConical,
  Radio,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SubscriptionView = "all" | "live" | "test" | "attention";

type PaymentFailureRow = {
  billingSubscriptionId: string;
  graceEndsAt: Date;
  suspendedAt: Date | null;
};

const ATTENTION_STATUSES = new Set([
  "PAST_DUE",
  "SUSPENDED",
  "UNPAID",
  "INCOMPLETE",
  "INCOMPLETE_EXPIRED",
]);

function isSubscriptionView(value: string | undefined): value is SubscriptionView {
  return value === "all" || value === "live" || value === "test" || value === "attention";
}

function isAttentionStatus(status: string) {
  return ATTENTION_STATUSES.has(status);
}

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMoney(unitAmountOre: number, currency: string) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(unitAmountOre / 100);
}

function formatPlan(planCode: string) {
  switch (planCode) {
    case "STARTER":
      return "Starter";
    case "SAAS":
      return "Growth";
    case "BUSINESS":
      return "Business";
    default:
      return planCode;
  }
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: string) {
  if (status === "ACTIVE" || status === "TRIALING") return "good";
  if (status === "PAST_DUE" || status === "CANCELING") return "warning";
  if (
    status === "SUSPENDED" ||
    status === "UNPAID" ||
    status === "INCOMPLETE" ||
    status === "INCOMPLETE_EXPIRED"
  ) {
    return "danger";
  }
  return "neutral";
}

function provisioningTone(status: string | null) {
  if (status === "ACTIVE" || status === "CLAIMED") return "good";
  if (status === "FAILED") return "danger";
  return "neutral";
}

function lifecycleLabel(status: string) {
  if (status === "TRIALING") return "Trial ends";
  if (status === "CANCELING") return "Cancels";
  if (status === "ACTIVE") return "Renews";
  return "Period end";
}

function stripeDashboardUrl(environment: "TEST" | "LIVE", stripeSubscriptionId: string) {
  return environment === "LIVE"
    ? `https://dashboard.stripe.com/subscriptions/${stripeSubscriptionId}`
    : `https://dashboard.stripe.com/test/subscriptions/${stripeSubscriptionId}`;
}

export default async function SaaSSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view: SubscriptionView = isSubscriptionView(params.view) ? params.view : "all";

  const [subscriptions, paymentFailures] = await Promise.all([
    prisma.billingSubscription.findMany({
      orderBy: [{ environment: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        stripeSubscriptionId: true,
        environment: true,
        planCode: true,
        interval: true,
        currency: true,
        unitAmountOre: true,
        status: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
        trialEnd: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            name: true,
            billingEmail: true,
          },
        },
        provisioning: {
          select: {
            status: true,
          },
        },
      },
    }),
    prisma.$queryRaw<PaymentFailureRow[]>`
      SELECT "billingSubscriptionId", "graceEndsAt", "suspendedAt"
      FROM "SaasPaymentFailureState"
    `,
  ]);

  const failureBySubscriptionId = new Map(
    paymentFailures.map((failure) => [failure.billingSubscriptionId, failure]),
  );

  const counts = {
    all: subscriptions.length,
    live: subscriptions.filter((subscription) => subscription.environment === "LIVE").length,
    test: subscriptions.filter((subscription) => subscription.environment === "TEST").length,
    attention: subscriptions.filter((subscription) => isAttentionStatus(subscription.status)).length,
  };

  const healthyCount = subscriptions.filter(
    (subscription) => subscription.status === "ACTIVE" || subscription.status === "TRIALING",
  ).length;

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    if (view === "live") return subscription.environment === "LIVE";
    if (view === "test") return subscription.environment === "TEST";
    if (view === "attention") return isAttentionStatus(subscription.status);
    return true;
  });

  const filters: Array<{ key: SubscriptionView; label: string; count: number }> = [
    { key: "all", label: "All", count: counts.all },
    { key: "live", label: "Live", count: counts.live },
    { key: "test", label: "Test", count: counts.test },
    { key: "attention", label: "Attention", count: counts.attention },
  ];

  return (
    <div className="hub-page hub-saas-subscriptions-page">
      <header className="hub-workspace-head">
        <div>
          <span className="hub-workspace-kicker">BILLING / SAAS</span>
          <h1>Subscriptions</h1>
          <p>
            Stripe-backed SaaS subscriptions, access state and provisioning status in one place.
          </p>
        </div>

        <Link href="/hub/billing" className="hub-workspace-primary-action">
          <ArrowLeft size={15} />
          Billing overview
        </Link>
      </header>

      <section className="hub-workspace-stats" aria-label="Subscription overview">
        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-info">
            <CreditCard size={16} />
          </span>
          <div>
            <small>Subscriptions</small>
            <strong>{counts.all}</strong>
            <span>Test and live records</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-good">
            <Activity size={16} />
          </span>
          <div>
            <small>Healthy</small>
            <strong>{healthyCount}</strong>
            <span>Active or trialing</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className={`hub-workspace-stat-icon ${counts.attention ? "hub-saas-stat-danger" : ""}`}>
            <AlertTriangle size={16} />
          </span>
          <div>
            <small>Needs attention</small>
            <strong>{counts.attention}</strong>
            <span>Payment or lifecycle issue</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon">
            <Radio size={16} />
          </span>
          <div>
            <small>Live</small>
            <strong>{counts.live}</strong>
            <span>{counts.test} sandbox subscription{counts.test === 1 ? "" : "s"}</span>
          </div>
        </div>
      </section>

      <nav className="hub-workspace-filters" aria-label="Subscription filters">
        {filters.map((filter) => (
          <Link
            key={filter.key}
            href={filter.key === "all" ? "/hub/billing/subscriptions" : `/hub/billing/subscriptions?view=${filter.key}`}
            className={view === filter.key ? "hub-workspace-filter-active" : undefined}
          >
            {filter.key === "test" && <FlaskConical size={12} />}
            {filter.label}
            <strong>{filter.count}</strong>
          </Link>
        ))}
      </nav>

      {filteredSubscriptions.length === 0 ? (
        <div className="hub-empty-state">
          <CreditCard size={28} />
          <h2>No subscriptions in this view</h2>
          <p>
            Subscription records will appear here after Stripe checkout and webhook synchronization.
          </p>
          {view !== "all" && (
            <Link href="/hub/billing/subscriptions" className="hub-secondary-button">
              Show all subscriptions
            </Link>
          )}
        </div>
      ) : (
        <section className="hub-saas-subscriptions-list" aria-label="SaaS subscriptions">
          {filteredSubscriptions.map((subscription) => {
            const failure = failureBySubscriptionId.get(subscription.id) ?? null;
            const provisioningStatus = subscription.provisioning?.status ?? null;
            const intervalLabel = subscription.interval === "MONTH" ? "month" : "year";
            const periodDate = subscription.status === "TRIALING"
              ? subscription.trialEnd
              : subscription.currentPeriodEnd;

            return (
              <article
                key={subscription.id}
                className={`hub-saas-subscription-row ${
                  isAttentionStatus(subscription.status) ? "hub-saas-subscription-row-attention" : ""
                }`}
              >
                <div className="hub-saas-subscription-main">
                  <span className="hub-saas-subscription-icon">
                    <Building2 size={16} />
                  </span>

                  <div>
                    <Link href={`/hub/clients/${subscription.client.id}`}>
                      {subscription.client.name}
                    </Link>
                    <span>{subscription.client.billingEmail ?? "No billing email"}</span>
                    <small>{subscription.stripeSubscriptionId}</small>
                  </div>
                </div>

                <div className="hub-saas-subscription-plan">
                  <small>Plan</small>
                  <strong>{formatPlan(subscription.planCode)}</strong>
                  <span>
                    {formatMoney(subscription.unitAmountOre, subscription.currency)} / {intervalLabel}
                  </span>
                </div>

                <div className="hub-saas-subscription-state">
                  <span className={`hub-saas-chip hub-saas-chip-${statusTone(subscription.status)}`}>
                    {formatStatus(subscription.status)}
                  </span>

                  <span className={`hub-saas-chip hub-saas-chip-${provisioningTone(provisioningStatus)}`}>
                    {provisioningStatus ? formatStatus(provisioningStatus) : "No provisioning"}
                  </span>

                  {subscription.cancelAtPeriodEnd && (
                    <span className="hub-saas-chip hub-saas-chip-warning">Ends at period end</span>
                  )}
                </div>

                <div className="hub-saas-subscription-lifecycle">
                  <small>{lifecycleLabel(subscription.status)}</small>
                  <strong>{formatDate(periodDate)}</strong>

                  {subscription.status === "PAST_DUE" && failure ? (
                    <span className="hub-saas-lifecycle-warning">
                      Grace until {formatDate(failure.graceEndsAt)}
                    </span>
                  ) : subscription.status === "SUSPENDED" && failure?.suspendedAt ? (
                    <span className="hub-saas-lifecycle-danger">
                      Suspended {formatDate(failure.suspendedAt)}
                    </span>
                  ) : (
                    <span>Updated {formatDate(subscription.updatedAt)}</span>
                  )}
                </div>

                <div className="hub-saas-subscription-tail">
                  <span
                    className={`hub-saas-environment hub-saas-environment-${subscription.environment.toLowerCase()}`}
                  >
                    {subscription.environment}
                  </span>

                  <div>
                    <Link href={`/hub/clients/${subscription.client.id}`}>
                      Client
                    </Link>
                    <a
                      href={stripeDashboardUrl(subscription.environment, subscription.stripeSubscriptionId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Stripe
                      <ArrowUpRight size={12} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
