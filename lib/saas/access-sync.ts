import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  hasServiceAccess,
  type BillingSubscriptionStatusValue,
} from "./subscriptions";

export async function syncClientEntitlements(clientId: string) {
  const subscriptions = await prisma.billingSubscription.findMany({
    where: {
      clientId,
    },
    orderBy: { updatedAt: "desc" },
  });

  const accessible = subscriptions.filter((subscription) =>
    hasServiceAccess(
      subscription.status as BillingSubscriptionStatusValue,
    ),
  );

  const live = accessible.find(
    (subscription) => subscription.environment === "LIVE",
  );
  const selected = live ?? accessible[0] ?? null;

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
