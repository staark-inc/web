import { createHmac } from "node:crypto";

export type InventorySite = {
  id: string;
  key: string;
  organizationId: string | null;
  setupCompleted: boolean;
  domains: Array<{ hostname: string; primaryDomain: boolean; verified: boolean }>;
};

export type DiscoveryState = "registered" | "runtime_only" | "hub_only";

export function classifyInventory(
  runtimeSites: readonly InventorySite[],
  hubSiteIds: ReadonlySet<string>,
): Array<{ site: InventorySite; state: "registered" | "runtime_only" }> {
  return runtimeSites.map((site) => ({
    site,
    state: hubSiteIds.has(site.id) ? "registered" : "runtime_only",
  }));
}

function runtimeOrigin(): string | null {
  const configured = process.env.STAARK_RUNTIME_INTERNAL_URL?.trim();
  const fromProvisioning = process.env.STAARK_NEXT_PROVISIONING_URL
    ?.trim().replace(/\/api\/staark\/provision\/?$/, "");
  const value = configured || fromProvisioning;
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        url.search || url.hash || url.pathname.replace(/\/+$/, "") !== "") return null;
    return url.origin;
  } catch { return null; }
}

export type InventoryFetchResult =
  | { ok: true; sites: InventorySite[]; pages: number; complete: true }
  | { ok: false; sites: []; reason: string; complete: false };

export async function fetchRuntimeInventory(): Promise<InventoryFetchResult> {
  const origin = runtimeOrigin();
  const secret = process.env.STAARK_PROVISIONING_SECRET?.trim();
  if (!origin || !secret) {
    return { ok: false, sites: [], complete: false, reason: "Runtime inventory is not configured." };
  }
  const sites: InventorySite[] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  try {
    for (let page = 0; page < 10; page++) {
      const body = JSON.stringify({ cursor, limit: 100 });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = createHmac("sha256", secret)
        .update(`${timestamp}.${body}`).digest("hex");
      const response = await fetch(`${origin}/api/staark/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Staark-Timestamp": timestamp,
          "X-Staark-Signature": signature,
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`Runtime inventory HTTP ${response.status}.`);
      const json: unknown = await response.json();
      if (!json || typeof json !== "object" || !("ok" in json) || json.ok !== true ||
          !("sites" in json) || !Array.isArray(json.sites) ||
          !("nextCursor" in json)) throw new Error("Invalid inventory response.");
      const data = json as { sites: InventorySite[]; nextCursor: string | null };
      if (data.sites.length > 100 || data.sites.some((site) =>
        !site || typeof site.id !== "string" || typeof site.key !== "string" ||
        !Array.isArray(site.domains) || seen.has(site.id))) {
        throw new Error("Invalid or duplicated site inventory.");
      }
      for (const site of data.sites) { seen.add(site.id); sites.push(site); }
      if (data.nextCursor === null) {
        return { ok: true, sites, pages: page + 1, complete: true };
      }
      if (typeof data.nextCursor !== "string" || data.nextCursor === cursor || data.sites.length === 0) {
        throw new Error("Inventory pagination did not advance.");
      }
      cursor = data.nextCursor;
    }
    return { ok: false, sites: [], complete: false, reason: "Inventory exceeds the 1,000-site safety cap." };
  } catch {
    // Never publish an incomplete snapshot as a complete runtime inventory.
    return { ok: false, sites: [], complete: false, reason: "Runtime inventory could not be verified." };
  }
}
