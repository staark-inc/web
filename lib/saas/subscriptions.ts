import { getBillingPrice, type BillingInterval } from "./billing";
import { resolveEntitlements } from "./entitlements";
import type { StaarkPlanCode } from "./plans";

export type BillingEnvironmentValue = "TEST" | "LIVE";
export type BillingSubscriptionStatusValue =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELING"
  | "CANCELED"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "UNPAID"
  | "PAUSED";

export function toDbBillingInterval(interval: BillingInterval): "MONTH" | "YEAR" {
  return interval === "month" ? "MONTH" : "YEAR";
}

export function fromDbBillingInterval(interval: "MONTH" | "YEAR"): BillingInterval {
  return interval === "MONTH" ? "month" : "year";
}

export function toDbBillingEnvironment(environment: "test" | "live"): BillingEnvironmentValue {
  return environment === "test" ? "TEST" : "LIVE";
}

export function createSubscriptionSnapshot(
  planCode: StaarkPlanCode,
  interval: BillingInterval,
) {
  const billingPrice = getBillingPrice(planCode, interval);

  return {
    planCode,
    interval: toDbBillingInterval(interval),
    currency: billingPrice.currency,
    unitAmountOre: billingPrice.unitAmountOre,
    taxBehavior: billingPrice.taxBehavior,
    entitlements: resolveEntitlements(planCode),
  };
}

export function hasServiceAccess(status: BillingSubscriptionStatusValue): boolean {
  return status === "TRIALING" || status === "ACTIVE" || status === "PAST_DUE" || status === "CANCELING";
}

export function isTerminalSubscriptionStatus(status: BillingSubscriptionStatusValue): boolean {
  return status === "CANCELED" || status === "INCOMPLETE_EXPIRED";
}
