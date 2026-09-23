import { prisma } from "@/lib/prisma";

export const SYSTEM_EMAIL_TEMPLATE_KEYS = [
  "OFFER_SHARED",
  "OFFER_ACCEPTED",
  "PROJECT_CREATED",
  "PROJECT_UPDATE",
  "SUPPORT_REPLY",
  "LEAD_FOLLOWUP",
] as const;

export type SystemEmailTemplateKey =
  (typeof SYSTEM_EMAIL_TEMPLATE_KEYS)[number];

export type EmailTemplateDefinition = {
  key: SystemEmailTemplateKey;
  name: string;
  description: string;
  subject: string;
  body: string;
  active: boolean;
  variables: string[];
};

type StoredTemplateOverride = {
  subject?: unknown;
  body?: unknown;
  active?: unknown;
};

type StoredTemplateOverrides = Partial<
  Record<SystemEmailTemplateKey, StoredTemplateOverride>
>;

export const SYSTEM_EMAIL_TEMPLATE_DEFAULTS: Record<
  SystemEmailTemplateKey,
  EmailTemplateDefinition
> = {
  OFFER_SHARED: {
    key: "OFFER_SHARED",
    name: "Offer shared",
    description: "Loaded when an offer is prepared for a client.",
    subject: "Förslag: {{offerTitle}}",
    body: `Hej {{clientName}},

Här kommer vårt förslag för {{companyName}}: {{offerTitle}}.

Omfattning
{{offerScope}}

{{pricing}}

Support ingår i {{includedMonths}} månader enligt förslaget.

{{termsSection}}Se hela offerten och svara direkt här:
{{offerUrl}}

Återkom gärna om ni vill gå igenom förslaget tillsammans eller har några frågor.`,
    active: true,
    variables: [
      "clientName",
      "companyName",
      "offerTitle",
      "offerScope",
      "pricing",
      "includedMonths",
      "termsSection",
      "offerUrl",
      "senderName",
    ],
  },
  OFFER_ACCEPTED: {
    key: "OFFER_ACCEPTED",
    name: "Offer accepted",
    description: "Confirmation copy for an accepted offer.",
    subject: "Tack för att ni accepterade {{offerTitle}}",
    body: `Hej {{clientName}},

Tack för att ni accepterade {{offerTitle}}.

Vi återkommer med nästa steg och planeringen för projektet.

Projekt: {{projectName}}`,
    active: true,
    variables: [
      "clientName",
      "companyName",
      "offerTitle",
      "projectName",
      "senderName",
    ],
  },
  PROJECT_CREATED: {
    key: "PROJECT_CREATED",
    name: "Project created",
    description: "Welcome message when a new client project starts.",
    subject: "Projektet {{projectName}} är igång",
    body: `Hej {{clientName}},

Projektet {{projectName}} är nu skapat och vi kan börja samla material och planera nästa steg.

Ni kan följa projektet här:
{{projectUrl}}`,
    active: true,
    variables: [
      "clientName",
      "companyName",
      "projectName",
      "projectUrl",
      "senderName",
    ],
  },
  PROJECT_UPDATE: {
    key: "PROJECT_UPDATE",
    name: "Project update",
    description: "Reusable update for an active client project.",
    subject: "Uppdatering: {{projectName}}",
    body: `Hej {{clientName}},

Här kommer en uppdatering om {{projectName}}.

{{projectUpdate}}

Projektet finns här:
{{projectUrl}}`,
    active: true,
    variables: [
      "clientName",
      "companyName",
      "projectName",
      "projectUpdate",
      "projectUrl",
      "senderName",
    ],
  },
  SUPPORT_REPLY: {
    key: "SUPPORT_REPLY",
    name: "Support reply",
    description: "Default reply structure for a support request.",
    subject: "Angående {{supportTitle}}",
    body: `Hej {{clientName}},

Tack för att ni kontaktade oss angående {{supportTitle}}.

{{supportReply}}

Ärende: {{supportReference}}`,
    active: true,
    variables: [
      "clientName",
      "companyName",
      "supportTitle",
      "supportReply",
      "supportReference",
      "senderName",
    ],
  },
  LEAD_FOLLOWUP: {
    key: "LEAD_FOLLOWUP",
    name: "Lead follow-up",
    description: "First follow-up after a new lead arrives.",
    subject: "Tack för din förfrågan, {{clientName}}",
    body: `Hej {{clientName}},

Tack för din förfrågan till Staark Inc.

Vi har tagit emot informationen om {{leadService}} och återkommer så snart vi har gått igenom behovet.

{{leadMessage}}`,
    active: true,
    variables: [
      "clientName",
      "companyName",
      "leadService",
      "leadMessage",
      "senderName",
    ],
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeOverrides(value: unknown): StoredTemplateOverrides {
  if (!isObject(value)) {
    return {};
  }

  const overrides: StoredTemplateOverrides = {};

  for (const key of SYSTEM_EMAIL_TEMPLATE_KEYS) {
    const candidate = value[key];

    if (isObject(candidate)) {
      overrides[key] = candidate;
    }
  }

  return overrides;
}

export function mergeEmailTemplateOverrides(
  value: unknown
): EmailTemplateDefinition[] {
  const overrides = normalizeOverrides(value);

  return SYSTEM_EMAIL_TEMPLATE_KEYS.map((key) => {
    const defaults = SYSTEM_EMAIL_TEMPLATE_DEFAULTS[key];
    const stored = overrides[key];

    return {
      ...defaults,
      subject:
        typeof stored?.subject === "string"
          ? stored.subject
          : defaults.subject,
      body:
        typeof stored?.body === "string"
          ? stored.body
          : defaults.body,
      active:
        typeof stored?.active === "boolean"
          ? stored.active
          : defaults.active,
    };
  });
}

export function serializeEmailTemplateOverrides(
  templates: EmailTemplateDefinition[]
) {
  return Object.fromEntries(
    templates.map((template) => [
      template.key,
      {
        subject: template.subject,
        body: template.body,
        active: template.active,
      },
    ])
  );
}

export async function getEmailTemplates() {
  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
    select: { emailTemplates: true },
  });

  return mergeEmailTemplateOverrides(settings?.emailTemplates);
}

export async function getEmailTemplate(
  key: SystemEmailTemplateKey
) {
  const templates = await getEmailTemplates();

  return (
    templates.find((template) => template.key === key) ??
    SYSTEM_EMAIL_TEMPLATE_DEFAULTS[key]
  );
}

export function renderEmailTemplate(
  source: string,
  values: Record<string, string | number | null | undefined>
) {
  return source.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (match, key: string) => {
      const value = values[key];

      return value === null || value === undefined
        ? match
        : String(value);
    }
  );
}

export const EMAIL_TEMPLATE_SAMPLE_VALUES: Record<string, string> = {
  clientName: "Anna",
  companyName: "Nordic Studio AB",
  offerTitle: "Ny webbplats",
  offerScope: "Design, utveckling och SEO-optimerad lansering.",
  pricing: "Engångspris: 24 900 kr exkl. moms.",
  includedMonths: "6",
  termsSection: "Villkor\nBetalning enligt offert.\n\n",
  offerUrl: "https://staarkinc.com/offert/example",
  projectName: "Nordic Studio Website",
  projectUrl: "https://staarkinc.com/hub/projects/example",
  projectUpdate: "Startsidan är klar för genomgång och feedback.",
  supportTitle: "Uppdatering av webbplats",
  supportReply: "Vi har gått igenom ärendet och återkommer med nästa steg idag.",
  supportReference: "SUP-1042",
  leadService: "webbdesign och SEO",
  leadMessage: "Vi hör av oss med ett förslag på nästa steg.",
  senderName: "Staark Inc.",
};
