export type StripeMode = "live" | "test" | "unknown";
export type StripeEnvironment = "live" | "test";

type StripeEnvironmentStatus = {
  configured: boolean;
  secretConfigured: boolean;
  webhookConfigured: boolean;
  mode: StripeMode;
};

export type StripeConfigStatus = {
  configured: boolean;
  secretConfigured: boolean;
  webhookConfigured: boolean;
  mode: StripeMode;
  live: StripeEnvironmentStatus;
  test: StripeEnvironmentStatus;
};

function detectStripeMode(secretKey: string): StripeMode {
  if (secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_")) {
    return "live";
  }

  if (secretKey.startsWith("sk_test_") || secretKey.startsWith("rk_test_")) {
    return "test";
  }

  return "unknown";
}

function getEnvironmentStatus(
  secretKey: string,
  webhookSecret: string
): StripeEnvironmentStatus {
  return {
    configured: Boolean(secretKey),
    secretConfigured: Boolean(secretKey),
    webhookConfigured: Boolean(webhookSecret),
    mode: detectStripeMode(secretKey),
  };
}

export function getStripeConfigStatus(): StripeConfigStatus {
  const liveSecretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const liveWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const testSecretKey = process.env.STRIPE_TEST_SECRET_KEY?.trim() ?? "";
  const testWebhookSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET?.trim() ?? "";

  const live = getEnvironmentStatus(liveSecretKey, liveWebhookSecret);
  const test = getEnvironmentStatus(testSecretKey, testWebhookSecret);

  return {
    configured: live.configured,
    secretConfigured: live.secretConfigured,
    webhookConfigured: live.webhookConfigured,
    mode: live.mode,
    live,
    test,
  };
}

function getStripeSecretKey(environment: StripeEnvironment) {
  return environment === "test"
    ? process.env.STRIPE_TEST_SECRET_KEY?.trim()
    : process.env.STRIPE_SECRET_KEY?.trim();
}

export async function testStripeConnection(environment: StripeEnvironment = "live") {
  const secretKey = getStripeSecretKey(environment);

  if (!secretKey) {
    throw new Error(
      environment === "test"
        ? "STRIPE_TEST_SECRET_KEY is not configured."
        : "STRIPE_SECRET_KEY is not configured."
    );
  }

  const response = await fetch("https://api.stripe.com/v1/account", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | {
        id?: string;
        email?: string | null;
        country?: string | null;
        default_currency?: string | null;
        business_profile?: { name?: string | null } | null;
        settings?: { dashboard?: { display_name?: string | null } | null } | null;
        error?: { message?: string };
      }
    | null;

  if (!response.ok) {
    throw new Error(data?.error?.message || `Stripe returned HTTP ${response.status}.`);
  }

  return {
    id: data?.id ?? null,
    name:
      data?.business_profile?.name ??
      data?.settings?.dashboard?.display_name ??
      null,
    email: data?.email ?? null,
    country: data?.country ?? null,
    defaultCurrency: data?.default_currency?.toUpperCase() ?? null,
    mode: detectStripeMode(secretKey),
    environment,
  };
}
