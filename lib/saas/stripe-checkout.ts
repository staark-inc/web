import crypto from "node:crypto";

import {
  getBillingPrice,
  STAARK_TRIAL_DAYS,
  type BillingInterval,
} from "./billing";
import type { StaarkPlanCode } from "./plans";

export type SaaSCheckoutEnvironment = "test" | "live";

type StripePrice = {
  id: string;
  active: boolean;
  currency: string;
  unit_amount: number | null;
  lookup_key: string | null;
  tax_behavior: "exclusive" | "inclusive" | "unspecified";
  recurring: {
    interval: "day" | "week" | "month" | "year";
  } | null;
};

type StripeListResponse<T> = {
  data?: T[];
  error?: { message?: string };
};

type StripeCheckoutSessionResponse = {
  id?: string;
  url?: string | null;
  error?: { message?: string };
};

export type CreatedSaaSCheckoutSession = {
  id: string;
  url: string;
  environment: SaaSCheckoutEnvironment;
  planCode: StaarkPlanCode;
  interval: BillingInterval;
  priceId: string;
  lookupKey: string;
  trialDays: number;
};

export function getSaaSCheckoutEnvironment(): SaaSCheckoutEnvironment {
  const value =
    process.env.STRIPE_SAAS_CHECKOUT_ENVIRONMENT
      ?.trim()
      .toLowerCase();

  if (value === "live") {
    return "live";
  }

  if (value === "test") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Stripe TEST mode is disabled in production.",
      );
    }

    return "test";
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "STRIPE_SAAS_CHECKOUT_ENVIRONMENT=live is required in production.",
    );
  }

  return "test";
}

function getStripeSecretKey(environment: SaaSCheckoutEnvironment): string {
  const value =
    environment === "live"
      ? process.env.STRIPE_SECRET_KEY?.trim()
      : process.env.STRIPE_TEST_SECRET_KEY?.trim();

  if (!value) {
    throw new Error(
      environment === "live"
        ? "STRIPE_SECRET_KEY is not configured."
        : "STRIPE_TEST_SECRET_KEY is not configured.",
    );
  }

  return value;
}

async function stripeRequest<T>(
  environment: SaaSCheckoutEnvironment,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const secretKey = getStripeSecretKey(environment);
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${secretKey}`);

  const response = await fetch(`https://api.stripe.com${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null;

  if (!response.ok || !data) {
    throw new Error(
      data?.error?.message || `Stripe returned HTTP ${response.status}.`,
    );
  }

  return data;
}

export async function resolveStripePrice(
  planCode: StaarkPlanCode,
  interval: BillingInterval,
  environment: SaaSCheckoutEnvironment = getSaaSCheckoutEnvironment(),
): Promise<StripePrice> {
  const expected = getBillingPrice(planCode, interval);
  const query = new URLSearchParams();
  query.append("lookup_keys[]", expected.lookupKey);
  query.set("active", "true");
  query.set("limit", "10");

  const result = await stripeRequest<StripeListResponse<StripePrice>>(
    environment,
    `/v1/prices?${query.toString()}`,
  );

  const candidates = (result.data ?? []).filter(
    (price) => price.lookup_key === expected.lookupKey && price.active,
  );

  if (candidates.length !== 1) {
    throw new Error(
      `Expected exactly one active Stripe Price for ${expected.lookupKey}; found ${candidates.length}.`,
    );
  }

  const stripePrice = candidates[0];

  if (stripePrice.currency !== expected.currency) {
    throw new Error(
      `Stripe Price ${stripePrice.id} currency mismatch: expected ${expected.currency}, got ${stripePrice.currency}.`,
    );
  }

  if (stripePrice.unit_amount !== expected.unitAmountOre) {
    throw new Error(
      `Stripe Price ${stripePrice.id} amount mismatch: expected ${expected.unitAmountOre}, got ${stripePrice.unit_amount}.`,
    );
  }

  if (stripePrice.recurring?.interval !== interval) {
    throw new Error(
      `Stripe Price ${stripePrice.id} interval mismatch: expected ${interval}, got ${stripePrice.recurring?.interval ?? "none"}.`,
    );
  }

  if (stripePrice.tax_behavior !== expected.taxBehavior) {
    throw new Error(
      `Stripe Price ${stripePrice.id} tax behavior mismatch: expected ${expected.taxBehavior}, got ${stripePrice.tax_behavior}.`,
    );
  }

  return stripePrice;
}

export async function createSaaSCheckoutSession(input: {
  planCode: StaarkPlanCode;
  interval: BillingInterval;
  origin: string;
}): Promise<CreatedSaaSCheckoutSession> {
  const environment = getSaaSCheckoutEnvironment();
  const expected = getBillingPrice(input.planCode, input.interval);
  const stripePrice = await resolveStripePrice(
    input.planCode,
    input.interval,
    environment,
  );

  const reference = `saas_${crypto.randomUUID()}`;
  const successUrl = `${input.origin}/saas/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${input.origin}/saas?checkout=canceled`;

  const body = new URLSearchParams();
  body.set("mode", "subscription");
  // A real payment method is required even during the free trial.
  // Stripe Checkout uses it for future off-session subscription billing.
  body.set("payment_method_collection", "always");
  body.append("payment_method_types[]", "card");

  body.set("line_items[0][price]", stripePrice.id);
  body.set("line_items[0][quantity]", "1");
  body.set("client_reference_id", reference);
  body.set("success_url", successUrl);
  body.set("cancel_url", cancelUrl);
  body.set("billing_address_collection", "required");
  body.set("tax_id_collection[enabled]", "true");
  body.set("locale", "sv");
  body.set("subscription_data[trial_period_days]", String(STAARK_TRIAL_DAYS));
  body.set(
    "subscription_data[trial_settings][end_behavior][missing_payment_method]",
    "pause",
  );

  if (process.env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase() === "true") {
    body.set("automatic_tax[enabled]", "true");
  }

  const metadata = {
    staark_checkout_version: "v1",
    staark_plan: input.planCode,
    staark_interval: input.interval,
    staark_lookup_key: expected.lookupKey,
    staark_environment: environment,
    staark_trial_days: String(STAARK_TRIAL_DAYS),
  } as const;

  for (const [key, value] of Object.entries(metadata)) {
    body.set(`metadata[${key}]`, value);
    body.set(`subscription_data[metadata][${key}]`, value);
  }

  const session = await stripeRequest<StripeCheckoutSessionResponse>(
    environment,
    "/v1/checkout/sessions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!session.id || !session.url) {
    throw new Error("Stripe Checkout Session was created without an id or URL.");
  }

  return {
    id: session.id,
    url: session.url,
    environment,
    planCode: input.planCode,
    interval: input.interval,
    priceId: stripePrice.id,
    lookupKey: expected.lookupKey,
    trialDays: STAARK_TRIAL_DAYS,
  };
}
