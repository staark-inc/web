"use client";

import { useState } from "react";

import {
  STAARK_BILLING_PRICES,
  formatBillingAmount,
  type BillingInterval,
} from "@/lib/saas/billing";
import { STAARK_PLANS, type StaarkPlanCode } from "@/lib/saas/plans";

const PLAN_ORDER: StaarkPlanCode[] = ["STARTER", "SAAS", "BUSINESS"];

export default function SaaSPage() {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [loadingPlan, setLoadingPlan] = useState<StaarkPlanCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(planCode: StaarkPlanCode) {
    setLoadingPlan(planCode);
    setError(null);

    try {
      const response = await fetch("/api/saas/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode, interval }),
      });

      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Kunde inte starta Stripe Checkout.");
      }

      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Kunde inte starta Stripe Checkout.",
      );
      setLoadingPlan(null);
    }
  }

  return (
    <main className="v2-page">
      <section className="v2-hero">
        <div className="v2-hero-copy">
          <span className="v2-pill">STAARK SAAS</span>
          <h1>En webbplats. Rätt verktyg för varje steg.</h1>
          <p>
            Alla planer gäller en produktionswebbplats med hosting,
            SSL och löpande drift från första dagen.
          </p>

          <div className="v2-actions" role="group" aria-label="Billing interval">
            <button
              type="button"
              className={
                interval === "month"
                  ? "v2-button v2-button-primary"
                  : "v2-button v2-button-outline"
              }
              onClick={() => setInterval("month")}
            >
              Månadsvis
            </button>
            <button
              type="button"
              className={
                interval === "year"
                  ? "v2-button v2-button-primary"
                  : "v2-button v2-button-outline"
              }
              onClick={() => setInterval("year")}
            >
              Årsvis
            </button>
          </div>

          {error ? <p role="alert">{error}</p> : null}
        </div>
      </section>

      <section className="v2-section v2-pricing">
        <div className="v2-package-grid">
          {PLAN_ORDER.map((planCode) => {
            const plan = STAARK_PLANS[planCode];
            const price = STAARK_BILLING_PRICES[planCode][interval];
            const busy = loadingPlan === planCode;

            return (
              <article
                key={planCode}
                className={`v2-package ${planCode === "SAAS" ? "featured" : ""}`}
              >
                <div className="v2-package-head">
                  <h2>{plan.name}</h2>
                  {planCode === "SAAS" ? <span>REKOMMENDERAD</span> : null}
                </div>

                <p className="pricing-description">{plan.description}</p>

                <div className="v2-price">
                  <strong>{formatBillingAmount(price.unitAmountOre)}</strong>
                  <small>{interval === "month" ? "/ mån" : "/ år"}</small>
                </div>

                <ul>
                  <li>1 webbplats</li>
                  <li>{plan.entitlements.hosting.storageGb} GB lagring</li>
                  <li>{plan.entitlements.backups.retentionDays} dagars backuphistorik</li>
                  <li>Security: {plan.entitlements.security}</li>
                  <li>Performance: {plan.entitlements.performance}</li>
                  <li>SEO: {plan.entitlements.seo}</li>
                </ul>

                <button
                  type="button"
                  className={
                    planCode === "SAAS"
                      ? "v2-button v2-button-primary"
                      : "v2-button v2-button-outline"
                  }
                  disabled={loadingPlan !== null}
                  onClick={() => startCheckout(planCode)}
                >
                  {busy ? "Öppnar Stripe..." : `Välj ${plan.name}`}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
