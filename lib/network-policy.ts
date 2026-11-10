import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import type { SecurityEnvironment } from "./origin-policy.ts";

export * from "./origin-policy.ts";

const PRIVATE_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".home.arpa",
];

const METADATA_HOSTS = new Set([
  "metadata",
  "metadata.google.internal",
  "instance-data",
  "instance-data.ec2.internal",
]);

const PRIVATE_SERVICE_ENV_NAMES = new Set([
  "DEMO_MANAGER_URL",
  "REALTIME_URL",
  "STAARK_NEXT_PROVISIONING_URL",
  "STAARK_RUNTIME_INTERNAL_URL",
]);

export function isPrivateHostname(
  hostname: string
): boolean {
  const value = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");

  if (!value) return true;

  if (value === "localhost") return true;

  if (
    METADATA_HOSTS.has(value) ||
    PRIVATE_HOST_SUFFIXES.some((suffix) =>
      value.endsWith(suffix)
    )
  ) {
    return true;
  }

  return isIP(value) ? isPrivateAddress(value) : false;
}

export function isPrivateAddress(
  address: string
): boolean {
  const value = address
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");

  const family = isIP(value);

  if (family === 6) {
    if (value === "::" || value === "::1") {
      return true;
    }

    const mapped = value.match(
      /^::ffff:(\d+\.\d+\.\d+\.\d+)$/
    );

    if (mapped) {
      return isPrivateAddress(mapped[1]);
    }

    return (
      value.startsWith("fc") ||
      value.startsWith("fd") ||
      /^fe[89ab]/.test(value) ||
      value.startsWith("ff") ||
      value.startsWith("2001:db8:")
    );
  }

  if (family === 4) {
    const parts = value.split(".").map(Number);

    if (
      parts.length !== 4 ||
      parts.some(
        (part) =>
          !Number.isInteger(part) ||
          part < 0 ||
          part > 255
      )
    ) {
      return true;
    }

    const [a, b] = parts;

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51) ||
      (a === 203 && b === 0) ||
      a >= 224
    );
  }

  return true;
}

export type ExternalUrlPolicy = {
  allowedHosts?: string[];
  allowHttp?: boolean;
};

export function assertPublicHttpsUrl(
  value: string | URL,
  policy: ExternalUrlPolicy = {}
): URL {
  const url = value instanceof URL
    ? new URL(value.toString())
    : new URL(value);

  const allowedProtocols = policy.allowHttp
    ? new Set(["http:", "https:"])
    : new Set(["https:"]);

  if (!allowedProtocols.has(url.protocol)) {
    throw new Error(
      "External URL must use HTTPS."
    );
  }

  if (url.username || url.password) {
    throw new Error(
      "External URL must not contain credentials."
    );
  }

  if (isPrivateHostname(url.hostname)) {
    throw new Error(
      "External URL must not target a private or local network."
    );
  }

  if (
    policy.allowedHosts &&
    !policy.allowedHosts
      .map((host) => host.toLowerCase())
      .includes(url.hostname.toLowerCase())
  ) {
    throw new Error(
      "External URL host is not approved."
    );
  }

  return url;
}

export async function assertResolvablePublicHost(
  hostname: string
): Promise<void> {
  if (isPrivateHostname(hostname)) {
    throw new Error(
      "External host is private or local."
    );
  }

  const addresses = await lookup(hostname, {
    all: true,
    verbatim: true,
  });

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) =>
      isPrivateAddress(address)
    )
  ) {
    throw new Error(
      "External host resolves to a private address."
    );
  }
}

export async function assertSafeExternalUrl(
  value: string | URL,
  policy: ExternalUrlPolicy = {}
): Promise<URL> {
  const url = assertPublicHttpsUrl(value, policy);
  await assertResolvablePublicHost(url.hostname);
  return url;
}

export function assertConfiguredServiceUrl(
  value: string,
  envName: string,
  env: SecurityEnvironment = process.env
): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `${envName} must be an absolute URL.`
    );
  }

  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    throw new Error(
      `${envName} must use HTTP or HTTPS.`
    );
  }

  if (METADATA_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(
      `${envName} must not target a cloud metadata endpoint.`
    );
  }

  const privateTarget =
    isPrivateHostname(url.hostname);

  const privateException =
    PRIVATE_SERVICE_ENV_NAMES.has(envName) ||
    env.ALLOW_PRIVATE_SERVICE_URLS === "1";

  if (
    url.protocol !== "https:" &&
    env.NODE_ENV === "production" &&
    !privateException
  ) {
    throw new Error(
      `${envName} must use HTTPS in production.`
    );
  }

  if (
    privateTarget &&
    env.NODE_ENV === "production" &&
    !privateException
  ) {
    throw new Error(
      `${envName} targets a private network; set ALLOW_PRIVATE_SERVICE_URLS=1 only for a trusted internal service.`
    );
  }

  if (url.username || url.password) {
    throw new Error(
      `${envName} must not contain credentials.`
    );
  }

  return url;
}

export async function safeExternalFetch(
  input: string | URL,
  init: RequestInit = {},
  policy: ExternalUrlPolicy = {}
): Promise<Response> {
  let current = input instanceof URL
    ? input
    : new URL(input);

  for (let redirects = 0; redirects <= 3; redirects++) {
    await assertSafeExternalUrl(current, policy);

    const response = await fetch(current, {
      ...init,
      redirect: "manual",
    });

    if (
      response.status >= 300 &&
      response.status < 400
    ) {
      const location =
        response.headers.get("location");

      if (!location) {
        throw new Error(
          "External redirect did not include a location."
        );
      }

      await response.body
        ?.cancel()
        .catch(() => undefined);

      current = new URL(location, current);
      continue;
    }

    return response;
  }

  throw new Error(
    "External request exceeded the redirect limit."
  );
}
