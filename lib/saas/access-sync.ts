import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type { BillingSubscriptionStatusValue } from "./subscriptions";

const ACCESS_STATUSES: BillingSubscriptionStatusValue[] = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELING",
];

export async function syncClientEntitlements(clientId: string) {
  const subscriptions = await prisma.billingSubscription.findMany({
    where: {
      clientId,
      status: { in: ACCESS_STATUSES },
    },
    orderBy: { updatedAt: "desc" },
  });

  const live = subscriptions.find(
    (subscription) => subscription.environment === "LIVE",
  );
  const selected = live ?? subscriptions[0] ?? null;

  if (!selected) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        saasPlanCode: null,
        saasEntitlements: {},
      },
    });
    return;
  }

  if (selected.entitlements === null) {
    throw new Error(
      `Billing subscription ${selected.id} has a null entitlement snapshot.`,
    );
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      saasPlanCode: selected.planCode,
      saasEntitlements: selected.entitlements as Prisma.InputJsonValue,
    },
  });
}
