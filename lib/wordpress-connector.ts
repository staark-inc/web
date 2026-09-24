import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { prisma } from "@/lib/prisma";

const CONNECTOR_CIPHER_VERSION = "v1";
const SIGNATURE_MAX_AGE_SECONDS = 5 * 60;

export type WordPressSitePayload = {
  siteId: string;
  siteUrl: string;
  siteName: string;
  adminUrl: string | null;
  wordpressVersion: string | null;
  phpVersion: string | null;
  hubVersion: string | null;
  theme: string | null;
  locale: string | null;
  timezone: string | null;
  capabilities: Record<string, boolean> | null;
};

function connectorKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");

  return createHash("sha256")
    .update(`staark-wordpress-connector:${secret}`)
    .digest();
}

export function normalizePairingCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export function hashPairingCode(value: string) {
  return createHash("sha256").update(normalizePairingCode(value)).digest("hex");
}

export function generatePairingCode() {
  const token = randomBytes(6).toString("hex").toUpperCase();
  return `STK-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
}

export function encryptSiteSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", connectorKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    CONNECTOR_CIPHER_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptSiteSecret(value: string) {
  const [version, ivValue, tagValue, ciphertextValue] = value.split(".");
  if (
    version !== CONNECTOR_CIPHER_VERSION ||
    !ivValue ||
    !tagValue ||
    !ciphertextValue
  ) {
    throw new Error("Invalid WordPress connector secret");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    connectorKey(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function stringValue(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function nullableString(value: unknown, max: number) {
  const result = stringValue(value, max);
  return result || null;
}

function safeUrl(value: unknown, required: boolean) {
  const input = stringValue(value, 500);
  if (!input && !required) return null;

  try {
    const url = new URL(input);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString().slice(0, 500);
  } catch {
    return null;
  }
}

export function parseWordPressSitePayload(value: unknown): WordPressSitePayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const siteId = stringValue(source.siteId, 120);
  const siteUrl = safeUrl(source.siteUrl, true);
  const siteName = stringValue(source.siteName, 200);

  if (!siteId || !siteUrl || !siteName) return null;

  const rawCapabilities = source.capabilities;
  let capabilities: Record<string, boolean> | null = null;
  if (rawCapabilities && typeof rawCapabilities === "object" && !Array.isArray(rawCapabilities)) {
    capabilities = {};
    for (const [key, enabled] of Object.entries(rawCapabilities)) {
      if (typeof enabled === "boolean" && key.length <= 60) {
        capabilities[key] = enabled;
      }
    }
  }

  return {
    siteId,
    siteUrl,
    siteName,
    adminUrl: safeUrl(source.adminUrl, false),
    wordpressVersion: nullableString(source.wordpressVersion, 80),
    phpVersion: nullableString(source.phpVersion, 80),
    hubVersion: nullableString(source.hubVersion, 80),
    theme: nullableString(source.theme, 200),
    locale: nullableString(source.locale, 80),
    timezone: nullableString(source.timezone, 120),
    capabilities,
  };
}

export function sitePayloadData(site: WordPressSitePayload) {
  return {
    siteUrl: site.siteUrl,
    siteName: site.siteName,
    adminUrl: site.adminUrl,
    wordpressVersion: site.wordpressVersion,
    phpVersion: site.phpVersion,
    hubVersion: site.hubVersion,
    theme: site.theme,
    locale: site.locale,
    timezone: site.timezone,
    capabilities: site.capabilities
      ? JSON.parse(JSON.stringify(site.capabilities))
      : undefined,
  };
}

function validHexSignature(value: string) {
  return /^[a-f0-9]{64}$/i.test(value);
}

export async function verifyWordPressRequest(request: Request, rawBody: string) {
  const siteId = request.headers.get("x-staark-site-id")?.trim() ?? "";
  const timestampValue = request.headers.get("x-staark-timestamp")?.trim() ?? "";
  const signature = request.headers.get("x-staark-signature")?.trim() ?? "";

  if (!siteId || !timestampValue || !validHexSignature(signature)) {
    return { ok: false as const, status: 401, error: "Missing connector signature." };
  }

  const timestamp = Number(timestampValue);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > SIGNATURE_MAX_AGE_SECONDS) {
    return { ok: false as const, status: 401, error: "Connector signature expired." };
  }

  const site = await prisma.wordPressSite.findUnique({
    where: { siteId },
  });
  if (!site || site.status === "REVOKED") {
    return { ok: false as const, status: 401, error: "Unknown WordPress site." };
  }

  let secret: string;
  try {
    secret = decryptSiteSecret(site.siteSecretEncrypted);
  } catch {
    return { ok: false as const, status: 401, error: "Connector secret is unavailable." };
  }

  const path = new URL(request.url).pathname;
  const bodyHash = createHash("sha256").update(rawBody).digest("hex");
  const signedValue = [request.method.toUpperCase(), path, timestampValue, bodyHash].join("\n");
  const expected = createHmac("sha256", secret).update(signedValue).digest("hex");

  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureOk =
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer);

  if (!signatureOk) {
    return { ok: false as const, status: 401, error: "Invalid connector signature." };
  }

  return { ok: true as const, site };
}

export function mapWordPressTicketCategory(value: unknown) {
  switch (stringValue(value, 40).toLowerCase()) {
    case "technical":
      return "BUG" as const;
    case "content":
    case "design":
      return "CHANGE" as const;
    case "maintenance":
      return "WEBSITE" as const;
    default:
      return "OTHER" as const;
  }
}

export function mapWordPressTicketPriority(value: unknown) {
  return stringValue(value, 40).toLowerCase() === "urgent"
    ? ("URGENT" as const)
    : ("NORMAL" as const);
}

export function wordpressTicketReference(siteId: string, localId: number) {
  const compactSiteId = siteId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase();
  return `WP-${compactSiteId || "SITE"}-${localId}`;
}

export function connectorString(value: unknown, max: number) {
  return stringValue(value, max);
}
