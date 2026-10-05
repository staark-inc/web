"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  STAARK_BILLING_PRICES,
  formatBillingAmount,
  type BillingInterval,
} from "@/lib/saas/billing";
import { STAARK_PLANS, type StaarkPlanCode } from "@/lib/saas/plans";

const PLAN_ORDER: StaarkPlanCode[] = ["STARTER", "SAAS", "BUSINESS"];

function SaaSPageContent() {
  const searchParams = useSearchParams();

  const billingParam =
    searchParams.get("billing");

  const promoParam =
    searchParams.get("promo")
      ?.trim()
      .toUpperCase();

  const initialInterval: BillingInterval =
    billingParam === "year"
      ? "year"
      : "month";

  const initialPromotionCode =
    promoParam === "GROWTH15" ||
    promoParam === "GROWTH25"
      ? promoParam
      : "";

  const [interval, setInterval] =
    useState<BillingInterval>(
      initialInterval,
    );

  const [loadingPlan, setLoadingPlan] =
    useState<StaarkPlanCode | null>(null);

  const [promotionCode, setPromotionCode] =
    useState(initialPromotionCode);

  const [error, setError] =
    useState<string | null>(null);

  async function startCheckout(planCode: StaarkPlanCode) {
    setLoadingPlan(planCode);
    setError(null);

    try {
      const response = await fetch("/api/saas/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode,
          interval,
          ...(planCode === "SAAS" &&
          promotionCode.trim()
            ? {
                promotionCode:
                  promotionCode
                    .trim()
                    .toUpperCase(),
              }
            : {}),
        }),
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
          <span className="v2-pill">STAARK PLATFORM</span>
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

            const normalizedPromotionCode =
              promotionCode.trim().toUpperCase();

            const expectedPromotionCode =
              interval === "month"
                ? "GROWTH15"
                : "GROWTH25";

            const promotionApplied =
              planCode === "SAAS" &&
              normalizedPromotionCode ===
                expectedPromotionCode;

            const promotionPercent =
              interval === "month"
                ? 15
                : 25;

            const discountedAmountOre =
              Math.round(
                price.unitAmountOre *
                  (1 - promotionPercent / 100),
              );

            const promotionMessage =
              interval === "month"
                ? "15% rabatt i tre månader"
                : "25% rabatt på första årsbetalningen";

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

                <div
                  className={`v2-price ${
                    promotionApplied
                      ? "v2-price--promotion"
                      : ""
                  }`}
                >
                  {promotionApplied ? (
                    <span className="saas-price-original">
                      {formatBillingAmount(
                        price.unitAmountOre,
                      )}
                    </span>
                  ) : null}

                  <strong>
                    {formatBillingAmount(
                      promotionApplied
                        ? discountedAmountOre
                        : price.unitAmountOre,
                    )}
                  </strong>

                  <small>
                    {interval === "month"
                      ? "/ mån"
                      : "/ år"}
                  </small>
                </div>

                <ul>
                  <li>1 webbplats</li>
                  <li>{plan.entitlements.hosting.storageGb} GB lagring</li>
                  <li>{plan.entitlements.backups.retentionDays} dagars backuphistorik</li>
                  <li>Security: {plan.entitlements.security}</li>
                  <li>Performance: {plan.entitlements.performance}</li>
                  <li>SEO: {plan.entitlements.seo}</li>
                </ul>

                {planCode === "SAAS" ? (
                  <div
                    className={`saas-promotion ${
                      promotionApplied
                        ? "saas-promotion--active"
                        : ""
                    }`}
                  >
                    <div className="saas-promotion__head">
                      <div>
                        <span className="saas-promotion__eyebrow">
                          LANSERINGSERBJUDANDE
                        </span>

                        <strong>
                          {promotionMessage}
                        </strong>
                      </div>

                      <span className="saas-promotion__discount">
                        -{promotionPercent}%
                      </span>
                    </div>

                    {promotionApplied ? (
                      <div className="saas-promotion__success">
                        <span aria-hidden>✓</span>
                        <div>
                          <strong>
                            Rabatt aktiverad
                          </strong>
                          <small>
                            {interval === "month"
                              ? `${formatBillingAmount(
                                  discountedAmountOre,
                                )}/mån i tre månader`
                              : `${formatBillingAmount(
                                  discountedAmountOre,
                                )} första året`}
                          </small>
                        </div>
                      </div>
                    ) : null}

                    <label
                      className="saas-promotion__label"
                      htmlFor="saas-promotion-code"
                    >
                      Rabattkod
                    </label>

                    <div className="saas-promotion__field">
                      <input
                        id="saas-promotion-code"
                        type="text"
                        value={promotionCode}
                        onChange={(event) =>
                          setPromotionCode(
                            event.target.value.toUpperCase(),
                          )
                        }
                        placeholder={
                          expectedPromotionCode
                        }
                        autoComplete="off"
                        spellCheck={false}
                        aria-describedby="saas-promotion-help"
                      />

                      {promotionApplied ? (
                        <span
                          className="saas-promotion__check"
                          aria-label="Giltig rabattkod"
                        >
                          ✓
                        </span>
                      ) : null}
                    </div>

                    <small
                      id="saas-promotion-help"
                      className="saas-promotion__help"
                    >
                      {normalizedPromotionCode &&
                      !promotionApplied
                        ? `För ${
                            interval === "month"
                              ? "månadsbetalning"
                              : "årsbetalning"
                          } används ${expectedPromotionCode}.`
                        : `Använd ${expectedPromotionCode} — ${promotionMessage}.`}
                    </small>
                  </div>
                ) : null}

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

export default function SaaSPage() {
  return (
    <Suspense fallback={null}>
      <SaaSPageContent />
    </Suspense>
  );
}
