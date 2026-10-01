import type { StaarkPlanCode } from "./plans";

export type BillingInterval = "month" | "year";
export type BillingCurrency = "sek";
export type BillingTaxBehavior = "exclusive";

export type StaarkBillingPrice = {
  planCode: StaarkPlanCode;
  interval: BillingInterval;
  currency: BillingCurrency;
  unitAmountOre: number;
  lookupKey: string;
  taxBehavior: BillingTaxBehavior;
};

export const STAARK_TRIAL_DAYS = 14 as const;
export const STAARK_BILLING_CURRENCY: BillingCurrency = "sek";
export const STAARK_TAX_BEHAVIOR: BillingTaxBehavior = "exclusive";

const price = (
  planCode: StaarkPlanCode,
  interval: BillingInterval,
  unitAmountOre: number,
  lookupKey: string,
): StaarkBillingPrice => ({
  planCode,
  interval,
  currency: STAARK_BILLING_CURRENCY,
  unitAmountOre,
  lookupKey,
  taxBehavior: STAARK_TAX_BEHAVIOR,
});

/**
 * Canonical SaaS prices.
 *
 * Amounts are stored in Swedish öre and are exclusive of tax.
 * Annual billing is priced at 10x the monthly amount (two months included).
 * Stripe Price IDs are deliberately not stored here: checkout resolves the
 * stable lookupKey in the selected Stripe environment and persists the actual
 * Price ID on the subscription snapshot.
 */
export const STAARK_BILLING_PRICES: Record<
  StaarkPlanCode,
  Record<BillingInterval, StaarkBillingPrice>
> = {
  STARTER: {
    month: price("STARTER", "month", 19_900, "staark_starter_monthly_v1"),
    year: price("STARTER", "year", 199_000, "staark_starter_yearly_v1"),
  },
  SAAS: {
    month: price("SAAS", "month", 39_900, "staark_saas_monthly_v1"),
    year: price("SAAS", "year", 399_000, "staark_saas_yearly_v1"),
  },
  BUSINESS: {
    month: price("BUSINESS", "month", 89_900, "staark_business_monthly_v1"),
    year: price("BUSINESS", "year", 899_000, "staark_business_yearly_v1"),
  },
};

export function getBillingPrice(
  planCode: StaarkPlanCode,
  interval: BillingInterval,
): StaarkBillingPrice {
  return STAARK_BILLING_PRICES[planCode][interval];
}

export function getAnnualSavingsOre(planCode: StaarkPlanCode): number {
  const monthly = getBillingPrice(planCode, "month").unitAmountOre;
  const yearly = getBillingPrice(planCode, "year").unitAmountOre;
  return monthly * 12 - yearly;
}

export function formatBillingAmount(
  unitAmountOre: number,
  currency: BillingCurrency = STAARK_BILLING_CURRENCY,
  locale = "sv-SE",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(unitAmountOre / 100);
}
