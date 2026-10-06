import { createHash } from "node:crypto";
import { isIP } from "node:net";

export class ContactInputError extends Error {
  public status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export const CONTACT_MAX_BYTES = 64 * 1024;

export function contactSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    const allowed = [new URL(request.url).origin];
    for (const configured of [process.env.APP_URL, process.env.NEXT_PUBLIC_SITE_URL, "https://staarkinc.com"]) {
      if (configured) allowed.push(new URL(configured).origin);
    }
    return allowed.includes(new URL(origin).origin);
  } catch { return false; }
}

export async function readContactBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") || "";
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  if (!["application/json", "application/x-www-form-urlencoded", "multipart/form-data"].includes(mediaType)) {
    throw new ContactInputError(415, "Formulärets format stöds inte.");
  }
  const declared = Number(request.headers.get("content-length"));
  if (declared > CONTACT_MAX_BYTES) throw new ContactInputError(413, "Meddelandet är för stort.");
  if (!request.body) throw new ContactInputError(400, "Formuläret saknar uppgifter.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > CONTACT_MAX_BYTES) {
      await reader.cancel();
      throw new ContactInputError(413, "Meddelandet är för stort.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    if (mediaType === "application/json") {
      const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid object");
      return body as Record<string, unknown>;
    }
    const form = await new Response(bytes, { headers: { "Content-Type": contentType } }).formData();
    const fields: Record<string, unknown> = {};
    for (const [key, value] of form) {
      if (typeof value !== "string") throw new Error("Files are not supported");
      if (Object.hasOwn(fields, key)) throw new Error("Duplicate form field");
      Object.defineProperty(fields, key, { value, enumerable: true });
    }
    return fields;
  } catch {
    throw new ContactInputError(400, "Kontrollera formulärets uppgifter.");
  }
}

type Entry = { count: number; resetAt: number };

// Bounded per-process defense, not a distributed/edge rate limiter.
export function createContactLimiter() {
  const entries = new Map<string, Entry>();
  function consume(key: string, max: number, windowMs: number, now: number) {
    for (const [storedKey, entry] of entries) {
      if (entry.resetAt <= now) entries.delete(storedKey);
    }
    let entry = entries.get(key);
    if (!entry) {
      if (entries.size >= 10000) return Math.ceil(windowMs / 1000);
      entry = { count: 0, resetAt: now + windowMs };
      entries.set(key, entry);
    }
    if (entry.count >= max) return Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    entry.count += 1;
    return 0;
  }
  return {
    request(request: Request, now = Date.now(), trustProxy = process.env.CONTACT_TRUST_PROXY_HEADERS === "1") {
      const globalWait = consume("global", 60, 60000, now);
      if (globalWait) return globalWait;
      // Enable only behind a proxy that overwrites CF-Connecting-IP and blocks
      // direct origin access. Never trust caller-supplied X-Forwarded-For.
      const ip = trustProxy ? request.headers.get("cf-connecting-ip") : null;
      return ip && isIP(ip) ? consume(`ip:${ip}`, 5, 600000, now) : 0;
    },
    email(email: string, now = Date.now()) {
      const key = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
      return consume(`email:${key}`, 3, 600000, now);
    },
  };
}

const globalForContact = globalThis as typeof globalThis & { staarkContactLimiter?: ReturnType<typeof createContactLimiter> };
export const contactLimiter = globalForContact.staarkContactLimiter ??= createContactLimiter();
