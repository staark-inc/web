import { getSession } from "@/lib/auth";
import {
  SYSTEM_EMAIL_TEMPLATE_DEFAULTS,
  SYSTEM_EMAIL_TEMPLATE_KEYS,
  getEmailTemplates,
  serializeEmailTemplateOverrides,
  type SystemEmailTemplateKey,
} from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import { redirectTo } from "@/lib/redirect";

function isTemplateKey(value: string): value is SystemEmailTemplateKey {
  return SYSTEM_EMAIL_TEMPLATE_KEYS.includes(value as SystemEmailTemplateKey);
}

function templateRedirect(key: string, params: string) {
  return redirectTo(
    `/hub/settings?tab=templates&template=${encodeURIComponent(key)}&${params}`
  );
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return redirectTo("/hub/login");
  }

  const formData = await request.formData();
  const key = String(formData.get("key") ?? "").trim();

  if (!isTemplateKey(key)) {
    return redirectTo("/hub/settings?tab=templates&templateError=invalid_template");
  }

  const intent = String(formData.get("intent") ?? "save");
  const templates = await getEmailTemplates();
  const index = templates.findIndex((template) => template.key === key);

  if (index === -1) {
    return templateRedirect(key, "templateError=invalid_template");
  }

  if (intent === "reset") {
    templates[index] = { ...SYSTEM_EMAIL_TEMPLATE_DEFAULTS[key] };
  } else {
    const subject = String(formData.get("subject") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const active = formData.getAll("active").map(String).includes("1");

    if (!subject || subject.length > 300 || !body || body.length > 20000) {
      return templateRedirect(key, "templateError=invalid_template");
    }

    templates[index] = {
      ...templates[index],
      subject,
      body,
      active,
    };
  }

  try {
    await prisma.settings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        senderName: "Staark Inc.",
        senderEmail:
          process.env.HUB_FROM_EMAIL ??
          process.env.CONTACT_FROM_EMAIL ??
          "contact@staarkinc.com",
        emailTemplates: serializeEmailTemplateOverrides(templates),
      },
      update: {
        emailTemplates: serializeEmailTemplateOverrides(templates),
      },
    });

    return templateRedirect(key, "templateUpdated=1");
  } catch (error) {
    console.error("Template update failed:", error);
    return templateRedirect(key, "templateError=unknown");
  }
}
