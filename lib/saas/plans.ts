export type StaarkPlanCode = "STARTER" | "SAAS" | "BUSINESS";

export type SecurityLevel = "core" | "full";
export type PerformanceLevel = "core" | "full";
export type SeoLevel = "basic" | "full";
export type SearchConsoleLevel = "overview" | "full";
export type AnalyticsLevel = "overview" | "full" | "advanced";
export type ReportLevel = "basic" | "full" | "advanced";
export type AutomationLevel = "none" | "standard" | "advanced";
export type SupportLevel = "standard" | "priority";

export type StaarkEntitlements = {
  website: {
    max: number;
    customDomain: boolean;
  };
  hosting: {
    storageGb: number;
    ssl: boolean;
  };
  backups: {
    enabled: boolean;
    retentionDays: number;
    manual: boolean;
    restore: boolean;
    download: boolean;
  };
  security: SecurityLevel;
  performance: PerformanceLevel;
  seo: SeoLevel;
  integrations: {
    searchConsole: SearchConsoleLevel;
    analytics: AnalyticsLevel;
    businessProfile: boolean;
  };
  leads: {
    enabled: boolean;
  };
  reports: ReportLevel;
  automations: AutomationLevel;
  crm: {
    enabled: boolean;
    clientManagement: boolean;
  };
  team: {
    enabled: boolean;
  };
  support: SupportLevel;
};

export type StaarkPlanDefinition = {
  code: StaarkPlanCode;
  name: string;
  description: string;
  entitlements: StaarkEntitlements;
};

export const STAARK_PLANS: Record<StaarkPlanCode, StaarkPlanDefinition> = {
  STARTER: {
    code: "STARTER",
    name: "Starter",
    description: "Website care for one production website.",
    entitlements: {
      website: { max: 1, customDomain: true },
      hosting: { storageGb: 10, ssl: true },
      backups: {
        enabled: true,
        retentionDays: 7,
        manual: true,
        restore: true,
        download: true,
      },
      security: "core",
      performance: "core",
      seo: "basic",
      integrations: {
        searchConsole: "overview",
        analytics: "overview",
        businessProfile: false,
      },
      leads: { enabled: false },
      reports: "basic",
      automations: "none",
      crm: { enabled: false, clientManagement: false },
      team: { enabled: false },
      support: "standard",
    },
  },

  SAAS: {
    code: "SAAS",
    name: "Growth",
    description: "Growth tooling and integrations for one production website.",
    entitlements: {
      website: { max: 1, customDomain: true },
      hosting: { storageGb: 30, ssl: true },
      backups: {
        enabled: true,
        retentionDays: 14,
        manual: true,
        restore: true,
        download: true,
      },
      security: "full",
      performance: "full",
      seo: "full",
      integrations: {
        searchConsole: "full",
        analytics: "full",
        businessProfile: true,
      },
      leads: { enabled: true },
      reports: "full",
      automations: "standard",
      crm: { enabled: false, clientManagement: false },
      team: { enabled: false },
      support: "standard",
    },
  },

  BUSINESS: {
    code: "BUSINESS",
    name: "Business",
    description: "Operations, CRM and advanced reporting for one production website.",
    entitlements: {
      website: { max: 1, customDomain: true },
      hosting: { storageGb: 60, ssl: true },
      backups: {
        enabled: true,
        retentionDays: 30,
        manual: true,
        restore: true,
        download: true,
      },
      security: "full",
      performance: "full",
      seo: "full",
      integrations: {
        searchConsole: "full",
        analytics: "advanced",
        businessProfile: true,
      },
      leads: { enabled: true },
      reports: "advanced",
      automations: "advanced",
      crm: { enabled: true, clientManagement: true },
      team: { enabled: true },
      support: "priority",
    },
  },
};

export function getPlanDefinition(code: StaarkPlanCode): StaarkPlanDefinition {
  return STAARK_PLANS[code];
}
