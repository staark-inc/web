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

export type SubscriptionAccessPolicy = {
  serviceAccess: boolean;
  billingWarning: boolean;
  suspended: boolean;
  terminal: boolean;
};

export function getSubscriptionAccessPolicy(
  status: BillingSubscriptionStatusValue,
): SubscriptionAccessPolicy {
  switch (status) {
    case "TRIALING":
    case "ACTIVE":
    case "CANCELING":
      return {
        serviceAccess: true,
        billingWarning: false,
        suspended: false,
        terminal: false,
      };

    case "PAST_DUE":
      return {
        serviceAccess: true,
        billingWarning: true,
        suspended: false,
        terminal: false,
      };

    case "SUSPENDED":
    case "UNPAID":
    case "PAUSED":
      return {
        serviceAccess: false,
        billingWarning: true,
        suspended: true,
        terminal: false,
      };

    case "INCOMPLETE":
      return {
        serviceAccess: false,
        billingWarning: true,
        suspended: false,
        terminal: false,
      };

    case "CANCELED":
    case "INCOMPLETE_EXPIRED":
      return {
        serviceAccess: false,
        billingWarning: false,
        suspended: true,
        terminal: true,
      };
  }
}

export function hasServiceAccess(
  status: BillingSubscriptionStatusValue,
): boolean {
  return getSubscriptionAccessPolicy(status).serviceAccess;
}

export function hasBillingWarning(
  status: BillingSubscriptionStatusValue,
): boolean {
  return getSubscriptionAccessPolicy(status).billingWarning;
}

export function isSuspendedSubscriptionStatus(
  status: BillingSubscriptionStatusValue,
): boolean {
  return getSubscriptionAccessPolicy(status).suspended;
}

export function isTerminalSubscriptionStatus(
  status: BillingSubscriptionStatusValue,
): boolean {
  return getSubscriptionAccessPolicy(status).terminal;
}
