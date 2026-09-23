type StripeMode = "live" | "test" | "unknown";

export type StripeConfigStatus = {
  configured: boolean;
  secretConfigured: boolean;
  webhookConfigured: boolean;
  mode: StripeMode;
};

export function getStripeConfigStatus(): StripeConfigStatus {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";

  const mode: StripeMode = secretKey.startsWith("sk_live_")
    ? "live"
    : secretKey.startsWith("sk_test_")
      ? "test"
      : "unknown";

  return {
    configured: Boolean(secretKey),
    secretConfigured: Boolean(secretKey),
    webhookConfigured: Boolean(webhookSecret),
    mode,
  };
}

export async function testStripeConnection() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
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
  };
}
