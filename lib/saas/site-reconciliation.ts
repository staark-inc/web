import type { RuntimeSiteHealth } from "./runtime-health";

export type SiteSnapshot = {
  siteId: string;
  hostname: string | null;
};

export type ReconciliationResult = {
  state: "matched" | "drift" | "unavailable" | "incomplete";
  findings: string[];
};

/** Compare one Hub binding with an authenticated runtime health response. Never writes state. */
export function reconcileSite(
  expected: SiteSnapshot,
  actual: RuntimeSiteHealth | null,
): ReconciliationResult {
  if (!expected.siteId || !expected.hostname) {
    return { state: "incomplete", findings: ["Hub runtime binding is incomplete."] };
  }
  if (!actual || !actual.reachable || !actual.ok) {
    return {
      state: "unavailable",
      findings: [actual?.error || "Runtime health could not be verified."],
    };
  }
  if (!actual.site?.exists) {
    return { state: "drift", findings: ["Runtime reports this site does not exist."] };
  }

  const findings: string[] = [];
  if (actual.site.id !== expected.siteId) {
    findings.push("Runtime site ID differs from the Hub binding.");
  }
  if (actual.site.setupCompleted === false) {
    findings.push("Runtime site setup is not complete.");
  }
  if (actual.database?.ok === false) {
    findings.push("Runtime database health is degraded.");
  }

  // Only compare domain membership if the runtime supplied a domain inventory.
  // Do not interpret a missing field as an empty inventory.
  if (actual.site.domains) {
    const hostname = expected.hostname.trim().toLowerCase().replace(/\.$/, "");
    const found = actual.site.domains.some(
      (domain) => domain.hostname.trim().toLowerCase().replace(/\.$/, "") === hostname,
    );
    if (!found) findings.push("Hub hostname is absent from runtime domains.");
  }

  return {
    state: findings.length ? "drift" : "matched",
    findings: findings.length ? findings : ["No discrepancies in reported fields."],
  };
}
