import {
  getPlanDefinition,
  type StaarkEntitlements,
  type StaarkPlanCode,
} from "./plans";

export type EntitlementPath =
  | "website.max"
  | "website.customDomain"
  | "hosting.storageGb"
  | "hosting.ssl"
  | "backups.enabled"
  | "backups.retentionDays"
  | "backups.manual"
  | "backups.restore"
  | "backups.download"
  | "security"
  | "performance"
  | "seo"
  | "integrations.searchConsole"
  | "integrations.analytics"
  | "integrations.businessProfile"
  | "leads.enabled"
  | "reports"
  | "automations"
  | "crm.enabled"
  | "crm.clientManagement"
  | "team.enabled"
  | "support";

export function resolveEntitlements(
  planCode: StaarkPlanCode,
  overrides?: Partial<StaarkEntitlements> | null,
): StaarkEntitlements {
  const base = getPlanDefinition(planCode).entitlements;

  if (!overrides) return structuredClone(base);

  return {
    ...base,
    ...overrides,
    website: { ...base.website, ...overrides.website },
    hosting: { ...base.hosting, ...overrides.hosting },
    backups: { ...base.backups, ...overrides.backups },
    integrations: { ...base.integrations, ...overrides.integrations },
    leads: { ...base.leads, ...overrides.leads },
    crm: { ...base.crm, ...overrides.crm },
    team: { ...base.team, ...overrides.team },
  };
}

export function getEntitlement(
  entitlements: StaarkEntitlements,
  path: EntitlementPath,
): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, entitlements);
}

export function canUse(
  entitlements: StaarkEntitlements,
  path: EntitlementPath,
): boolean {
  const value = getEntitlement(entitlements, path);

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return value !== "none";

  return Boolean(value);
}

export function getLimit(
  entitlements: StaarkEntitlements,
  path: "website.max" | "hosting.storageGb" | "backups.retentionDays",
): number {
  const value = getEntitlement(entitlements, path);
  if (typeof value !== "number") {
    throw new Error(`Entitlement ${path} is not numeric`);
  }
  return value;
}
