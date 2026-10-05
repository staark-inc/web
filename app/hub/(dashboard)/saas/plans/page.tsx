import { Check, Layers3 } from "lucide-react";

import { STAARK_PLANS } from "@/lib/saas/plans";

export default function SaaSPlansPage() {
  const plans = Object.values(STAARK_PLANS);

  return (
    <div className="hub-page">
      <header className="hub-workspace-head">
        <div>
          <span className="hub-workspace-kicker">SAAS / PLANS</span>
          <h1>Plans</h1>
          <p>Canonical product entitlements used by billing, provisioning and runtime access.</p>
        </div>
      </header>

      <section className="hub-workspace-stats" aria-label="Plan overview">
        {plans.map((plan) => (
          <div key={plan.code} className="hub-workspace-stat">
            <span className="hub-workspace-stat-icon"><Layers3 size={16} /></span>
            <div>
              <small>{plan.code}</small>
              <strong>{plan.name}</strong>
              <span>{plan.entitlements.hosting.storageGb} GB · {plan.entitlements.backups.retentionDays} day backups</span>
            </div>
          </div>
        ))}
      </section>

      <section className="hub-billing-v2-list" aria-label="SaaS plans">
        {plans.map((plan) => (
          <article key={plan.code} className="hub-billing-v2-row">
            <div className="hub-billing-v2-main">
              <span className="hub-billing-v2-icon"><Layers3 size={16} /></span>
              <div>
                <strong>{plan.name}</strong>
                <span>{plan.description}</span>
                <small>{plan.code}</small>
              </div>
            </div>
            <div className="hub-billing-v2-terms">
              <small>Website</small>
              <strong>{plan.entitlements.website.max} site</strong>
              <span>{plan.entitlements.website.customDomain ? "Custom domain" : "No custom domain"}</span>
            </div>
            <div className="hub-billing-v2-project">
              <small>Growth</small>
              <strong>{plan.entitlements.seo} SEO</strong>
              <span>{plan.entitlements.analytics} analytics · {plan.entitlements.automations} automations</span>
            </div>
            <div className="hub-billing-v2-tail">
              <span><Check size={13} /> {plan.entitlements.support} support</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
