import type {
  BillingEnvironment,
  BillingSubscriptionStatus,
  Prisma,
  StaarkPlanCode,
} from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

const PROVISIONABLE_STATUSES: BillingSubscriptionStatus[] = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELING",
];

type ProvisionableSubscription = {
  id: string;
  clientId: string;
  environment: BillingEnvironment;
  planCode: StaarkPlanCode;
  status: BillingSubscriptionStatus;
  entitlements: Prisma.JsonValue;
};

export function shouldProvisionSubscription(
  status: BillingSubscriptionStatus,
): boolean {
  return PROVISIONABLE_STATUSES.includes(status);
}

export async function ensureProvisioningForSubscription(
  subscription: ProvisionableSubscription,
) {
  if (!shouldProvisionSubscription(subscription.status)) return null;

  if (subscription.entitlements === null) {
    throw new Error(
      `Billing subscription ${subscription.id} has a null entitlement snapshot.`,
    );
  }

  return prisma.saasProvisioning.upsert({
    where: { billingSubscriptionId: subscription.id },
    create: {
      clientId: subscription.clientId,
      billingSubscriptionId: subscription.id,
      environment: subscription.environment,
      planCode: subscription.planCode,
      entitlements: subscription.entitlements as Prisma.InputJsonValue,
      status: "PENDING_SETUP",
    },
    update: {
      clientId: subscription.clientId,
      environment: subscription.environment,
      planCode: subscription.planCode,
      entitlements: subscription.entitlements as Prisma.InputJsonValue,
    },
  });
}
