import { createHash } from "node:crypto";
import { isIP } from "node:net";

import {
  RequestBodyError,
  readBoundedBody,
} from "@/lib/request-body";
import { sameOriginRequest } from "@/lib/request-security";

export class ContactInputError extends Error {
  public status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export const CONTACT_MAX_BYTES = 64 * 1024;

export function contactSameOrigin(request: Request) {
  return sameOriginRequest(request);
}

export async function readContactBody(request: Request): Promise<Record<string, unknown>> {
  try {
    return await readBoundedBody(request, CONTACT_MAX_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      const message =
        error.code === "too_large"
          ? "Meddelandet är för stort."
          : error.code === "unsupported"
            ? "Formulärets format stöds inte."
            : "Kontrollera formulärets uppgifter.";

      throw new ContactInputError(error.status, message);
    }

    throw error;
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
