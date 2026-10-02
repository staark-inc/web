"use server";

import {
  inspectSetupClaimToken,
  markSetupClaimTokenUsed,
} from "@/lib/saas/setup-claim";

import {
  provisionNextSite,
  type SaaSSetupInput,
} from "@/lib/saas/next-provisioning";

const RESERVED = new Set([
  "www",
  "admin",
  "api",
  "app",
  "mail",
  "smtp",
  "cdn",
  "assets",
  "static",
  "status",
  "support",
  "billing",
  "login",
  "dashboard",
  "account",
  "staark",
  "system",
  "internal",
]);

function text(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeSubdomain(value: unknown): string {
  const subdomain = text(value).toLowerCase();

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

  if (RESERVED.has(subdomain)) {
    throw new Error("This subdomain is reserved.");
  }

  return subdomain;
}

export async function completeSetupAction(
  body: Record<string, unknown>,
) {
  try {
    const token = text(body.token);

    if (!token) {
      throw new Error("Setup token is missing.");
    }

    const claim =
      await inspectSetupClaimToken(token);

    const businessName =
      text(body.businessName);

    const contactEmail =
      text(body.contactEmail).toLowerCase();

    const ownerName =
      text(body.ownerName);

    const ownerEmail =
      text(body.ownerEmail).toLowerCase();

    const ownerPassword =
      text(body.ownerPassword);

    if (!businessName) {
      throw new Error("Business name is required.");
    }

    if (!validEmail(contactEmail)) {
      throw new Error("Contact email is invalid.");
    }

    if (!ownerName) {
      throw new Error("Owner name is required.");
    }

    if (!validEmail(ownerEmail)) {
      throw new Error("Owner email is invalid.");
    }

    if (ownerPassword.length < 8) {
      throw new Error(
        "Password must contain at least 8 characters.",
      );
    }

    const subdomain =
      normalizeSubdomain(body.subdomain);

    const hostname =
      `${subdomain}.staark.app`;

    const websiteType =
      text(body.websiteType) as
        SaaSSetupInput["setup"]["websiteType"];

    const theme =
      text(body.theme) as
        SaaSSetupInput["setup"]["theme"];

    const result =
      await provisionNextSite(
        claim.provisioningId,
        {
          hostname,

          setup: {
            name: businessName,
            email: contactEmail,
            phone:
              text(body.phone) || undefined,
            locale: "sv-SE",
            websiteType,
            theme,

            pages: {
              contact:
                body.pageContact !== false,
              about:
                body.pageAbout === true,
              services:
                body.pageServices !== false,
            },

            owner: {
              name: ownerName,
              email: ownerEmail,
              password: ownerPassword,
            },
          },
        },
      );

    await markSetupClaimTokenUsed(token);

    return {
      ok: true as const,
      siteUrl: result.siteUrl,
      adminUrl: result.adminUrl,
      hostname: result.hostname,
    };
  } catch (error) {
    console.error(
      "[SAAS SETUP ACTION] Complete failed:",
      error,
    );

    return {
      ok: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Setup failed.",
    };
  }
}
