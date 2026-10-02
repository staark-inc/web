import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";

export type SaaSSetupInput = {
  hostname: string;

  setup: {
    name: string;
    email: string;
    phone?: string;
    locale?: string;

    websiteType:
      | "business"
      | "salon"
      | "restaurant"
      | "hotel"
      | "automotive"
      | "portfolio"
      | "custom";

    theme:
      | "light"
      | "salong"
      | "skonhet"
      | "el"
      | "gastfrihet"
      | "byra"
      | "webb"
      | "kreator";

    pages?: {
      contact?: boolean;
      about?: boolean;
      services?: boolean;
    };

    owner: {
      name: string;
      email: string;
      password: string;
    };
  };
};

type NextProvisioningResponse = {
  ok: boolean;
  error?: string;

  organizationId?: string;
  subscriptionId?: string;
  siteId?: string;
  siteKey?: string;
  hostname?: string;
  siteUrl?: string;
  adminUrl?: string;

  domainType?: string;
  domainVerified?: boolean;
  setupCompleted?: boolean;
};

function getConfig() {
  const url =
    process.env.STAARK_NEXT_PROVISIONING_URL?.trim();

  const secret =
    process.env.STAARK_PROVISIONING_SECRET?.trim();

  if (!url) {
    throw new Error(
      "STAARK_NEXT_PROVISIONING_URL is not configured.",
    );
  }

  if (!secret) {
    throw new Error(
      "STAARK_PROVISIONING_SECRET is not configured.",
    );
  }

  return {
    url,
    secret,
  };
}

function signBody(
  body: string,
  timestamp: string,
  secret: string,
) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

export async function provisionNextSite(
  provisioningId: string,
  input: SaaSSetupInput,
) {
  const provisioning =
    await prisma.saasProvisioning.findUnique({
      where: {
        id: provisioningId,
      },

      include: {
        client: true,

        billingSubscription: {
          include: {
            billingCustomer: true,
          },
        },
      },
    });

  if (!provisioning) {
    throw new Error(
      "SaaS provisioning was not found.",
    );
  }

  if (
    provisioning.status !== "PENDING_SETUP" &&
    provisioning.status !== "CLAIMED"
  ) {
    throw new Error(
      `Cannot provision Staark runtime from status ${provisioning.status}.`,
    );
  }

  const subscription =
    provisioning.billingSubscription;

  const customerEmail =
    provisioning.client.billingEmail?.trim();

  if (!customerEmail) {
    throw new Error(
      "Client billing email is required before provisioning.",
    );
  }

  const payload = {
    hubSubscriptionId:
      subscription.id,

    hubProvisioningId:
      provisioning.id,

    hubClientId:
      provisioning.clientId,

    environment:
      provisioning.environment,

    stripeCustomerId:
      subscription.billingCustomer.stripeCustomerId,

    stripeSubscriptionId:
      subscription.stripeSubscriptionId,

    customerName:
      provisioning.client.name,

    customerEmail,

    planCode:
      provisioning.planCode,

    billingInterval:
      subscription.interval,

    status:
      subscription.status,

    currentPeriodStart:
      subscription.currentPeriodStart
        ?.toISOString() ?? null,

    currentPeriodEnd:
      subscription.currentPeriodEnd
        ?.toISOString() ?? null,

    trialEnd:
      subscription.trialEnd
        ?.toISOString() ?? null,

    cancelAtPeriodEnd:
      subscription.cancelAtPeriodEnd,

    hostname:
      input.hostname,

    domainType:
      "platform" as const,

    setup:
      input.setup,
  };

  const body =
    JSON.stringify(payload);

  const timestamp =
    Math.floor(
      Date.now() / 1000,
    ).toString();

  const {
    url,
    secret,
  } = getConfig();

  const response =
    await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "X-Staark-Timestamp":
          timestamp,

        "X-Staark-Signature":
          signBody(
            body,
            timestamp,
            secret,
          ),
      },

      body,
      cache: "no-store",
    });

  const data =
    await response
      .json()
      .catch(() => null) as
      | NextProvisioningResponse
      | null;

  if (
    !response.ok ||
    !data?.ok
  ) {
    const message =
      data?.error ||
      `Staark runtime returned HTTP ${response.status}.`;

    await prisma.saasProvisioning.update({
      where: {
        id: provisioning.id,
      },

      data: {
        lastError:
          message,
      },
    });

    throw new Error(
      message,
    );
  }

  if (
    !data.organizationId ||
    !data.subscriptionId ||
    !data.siteId ||
    !data.siteKey ||
    !data.hostname ||
    !data.siteUrl ||
    !data.adminUrl ||
    !data.setupCompleted
  ) {
    throw new Error(
      "Staark runtime returned an incomplete provisioning response.",
    );
  }

  const now =
    new Date();

  await prisma.saasProvisioning.update({
    where: {
      id: provisioning.id,
    },

    data: {
      nextOrganizationId:
        data.organizationId,

      nextSubscriptionId:
        data.subscriptionId,

      nextSiteId:
        data.siteId,

      nextSiteKey:
        data.siteKey,

      nextHostname:
        data.hostname,

      nextSiteUrl:
        data.siteUrl,

      nextProvisionedAt:
        provisioning.nextProvisionedAt ??
        now,

      nextSetupExpiresAt:
        null,

      status:
        "ACTIVE",

      activatedAt:
        provisioning.activatedAt ??
        now,

      failedAt:
        null,

      lastError:
        null,
    },
  });

  return {
    organizationId:
      data.organizationId,

    subscriptionId:
      data.subscriptionId,

    siteId:
      data.siteId,

    siteKey:
      data.siteKey,

    hostname:
      data.hostname,

    siteUrl:
      data.siteUrl,

    adminUrl:
      data.adminUrl,

    setupCompleted:
      true,
  };
}
