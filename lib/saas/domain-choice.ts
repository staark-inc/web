import crypto from "node:crypto";

import { isReservedPlatformSubdomain } from "./platform-subdomains";

export type SaaSDomainMode = "platform" | "custom";

export function platformDomain(): string {
  const domain = process.env.SAAS_PLATFORM_DOMAIN?.trim().toLowerCase() || "staark.app";
  if (!/^[a-z0-9.-]+$/.test(domain) || !domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
    throw new Error("SAAS_PLATFORM_DOMAIN is invalid.");
  }
  return domain;
}


const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeDomainMode(value: unknown): SaaSDomainMode {
  return value === "custom" ? "custom" : "platform";
}

export function normalizePlatformSubdomain(value: unknown): string {
  const subdomain =
    typeof value === "string"
      ? value.trim().toLowerCase()
      : "";

  if (
    subdomain.length < 3 ||
    subdomain.length > 63 ||
    subdomain.includes("--") ||
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(subdomain)
  ) {
    throw new Error(
      "Subdomain must contain 3-63 lowercase letters, numbers or dashes.",
    );
  }

  if (isReservedPlatformSubdomain(subdomain)) {
    throw new Error("This subdomain is reserved.");
  }

  return subdomain;
}

export function normalizeCustomHostname(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Enter a valid domain name.");
  }

  let hostname = value.trim().toLowerCase();
  hostname = hostname.replace(/^https?:\/\//, "");
  hostname = hostname.replace(/\/.*$/, "");
  hostname = hostname.replace(/\.$/, "");

  if (!hostname || hostname.length > 253 || !hostname.includes(".")) {
    throw new Error("Enter a valid domain name, for example example.se.");
  }

  if (hostname.includes(":") || hostname.includes("_")) {
    throw new Error("Enter the hostname only, without port or protocol.");
  }

  const labels = hostname.split(".");
  if (
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        !HOST_LABEL.test(label),
    )
  ) {
    throw new Error("Enter a valid domain name, for example example.se.");
  }

  if (hostname === "staark.app" || hostname.endsWith(".staark.app")) {
    throw new Error(
      "staark.app addresses are platform domains and cannot be used as a custom domain.",
    );
  }

  return hostname;
}

export function fallbackPlatformHostname(provisioningId: string): string {
  const suffix = crypto
    .createHash("sha256")
    .update(provisioningId)
    .digest("hex")
    .slice(0, 10);

  return `site-${suffix}.${platformDomain()}`;
}
