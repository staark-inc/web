import { createHash } from "node:crypto";
import { isIP } from "node:net";

function configuredOrigin(
  value: string | undefined
): string | null {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function sameOriginRequest(
  request: Request
): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return (
      request.headers.get("sec-fetch-site") !==
      "cross-site"
    );
  }

  try {
    const allowed = new Set<string>([
      new URL(request.url).origin,
      "https://staarkinc.com",
      "https://www.staarkinc.com",
    ]);

    for (const configured of [
      process.env.APP_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.SAAS_PUBLIC_ORIGIN,
    ]) {
      const parsed = configuredOrigin(configured);
      if (parsed) allowed.add(parsed);
    }

    return allowed.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export function trustedProxyHeadersEnabled(): boolean {
  return (
    process.env.STAARK_TRUST_PROXY_HEADERS === "1" ||
    process.env.CONTACT_TRUST_PROXY_HEADERS === "1"
  );
}

/**
 * Only accept a client address when the deployment explicitly declares that
 * a trusted proxy overwrites it. Caller-supplied X-Forwarded-For is never
 * used as an identity.
 */
export function clientIp(
  request: Request,
  trustProxy = trustedProxyHeadersEnabled()
): string | null {
  if (!trustProxy) return null;

  for (const header of [
    "cf-connecting-ip",
    "x-real-ip",
  ]) {
    const value = request.headers
      .get(header)
      ?.trim();

    if (value && isIP(value)) {
      return value;
    }
  }

  return null;
}

export function hashIdentifier(
  value: string
): string {
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}
