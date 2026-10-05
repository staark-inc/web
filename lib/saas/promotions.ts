import type { BillingInterval } from "./billing";
import type { StaarkPlanCode } from "./plans";

export type SaaSPromotionCode =
  | "GROWTH15"
  | "GROWTH25";

type SaaSPromotionDefinition = {
  code: SaaSPromotionCode;
  planCode: StaarkPlanCode;
  interval: BillingInterval;
  envKey:
    | "STRIPE_GROWTH_MONTHLY_PROMOTION_CODE_ID"
    | "STRIPE_GROWTH_YEARLY_PROMOTION_CODE_ID";
};

const PROMOTIONS: Record<
  SaaSPromotionCode,
  SaaSPromotionDefinition
> = {
  GROWTH15: {
    code: "GROWTH15",
    planCode: "SAAS",
    interval: "month",
    envKey: "STRIPE_GROWTH_MONTHLY_PROMOTION_CODE_ID",
  },

  GROWTH25: {
    code: "GROWTH25",
    planCode: "SAAS",
    interval: "year",
    envKey: "STRIPE_GROWTH_YEARLY_PROMOTION_CODE_ID",
  },
};

export function normalizeSaaSPromotionCode(
  value: unknown,
): SaaSPromotionCode | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim().toUpperCase();

  if (
    normalized === "GROWTH15" ||
    normalized === "GROWTH25"
  ) {
    return normalized;
  }

  return null;
}

export function isPromotionEligible(
  code: SaaSPromotionCode,
  planCode: StaarkPlanCode,
  interval: BillingInterval,
): boolean {
  const promotion = PROMOTIONS[code];

  return (
    promotion.planCode === planCode &&
    promotion.interval === interval
  );
}

export function getStripePromotionCodeId(
  code: SaaSPromotionCode,
): string {
  const promotion = PROMOTIONS[code];

  const id =
    process.env[promotion.envKey]?.trim();

  if (!id) {
    throw new Error(
      `${promotion.envKey} is not configured.`,
    );
  }

  if (!id.startsWith("promo_")) {
    throw new Error(
      `${promotion.envKey} must contain a Stripe promotion code id.`,
    );
  }

  return id;
}
