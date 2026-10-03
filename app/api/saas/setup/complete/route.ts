import { NextResponse } from "next/server";

import {
  inspectSetupClaimToken,
  markSetupClaimTokenUsed,
} from "@/lib/saas/setup-claim";

import {
  provisionNextSite,
  type SaaSSetupInput,
} from "@/lib/saas/runtime-provisioning";
import {
  fallbackPlatformHostname,
  normalizeCustomHostname,
  normalizeDomainMode,
  normalizePlatformSubdomain,
} from "@/lib/saas/domain-choice";

export const runtime = "nodejs";

function text(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function email(
  value: string,
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json() as Record<
        string,
        unknown
      >;

    const token =
      text(body.token);

    if (!token) {
      throw new Error(
        "Setup token is missing.",
      );
    }

    const claim =
      await inspectSetupClaimToken(
        token,
      );

    const businessName =
      text(body.businessName);

    const contactEmail =
      text(body.contactEmail)
        .toLowerCase();

    const ownerName =
      text(body.ownerName);

    const ownerEmail =
      text(body.ownerEmail)
        .toLowerCase();

    const ownerPassword =
      text(body.ownerPassword);

    if (!businessName) {
      throw new Error(
        "Business name is required.",
      );
    }

    if (!email(contactEmail)) {
      throw new Error(
        "Contact email is invalid.",
      );
    }

    if (!ownerName) {
      throw new Error(
        "Owner name is required.",
      );
    }

    if (!email(ownerEmail)) {
      throw new Error(
        "Owner email is invalid.",
      );
    }

    if (ownerPassword.length < 8) {
      throw new Error(
        "Password must contain at least 8 characters.",
      );
    }

    const domainMode =
      normalizeDomainMode(
        body.domainMode,
      );

    const platformHostname =
      domainMode === "platform"
        ? `${normalizePlatformSubdomain(
            body.subdomain,
          )}.staark.app`
        : fallbackPlatformHostname(
            claim.provisioningId,
          );

    const customHostname =
      domainMode === "custom"
        ? normalizeCustomHostname(
            body.customDomain,
          )
        : null;

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
          domainMode,
          platformHostname,
          customHostname,

          setup: {
            name:
              businessName,

            email:
              contactEmail,

            phone:
              text(body.phone) ||
              undefined,

            locale:
              "sv-SE",

            websiteType,

            theme,

            pages: {
              contact:
                body.pageContact !==
                false,

              about:
                body.pageAbout ===
                true,

              services:
                body.pageServices !==
                false,
            },

            owner: {
              name:
                ownerName,

              email:
                ownerEmail,

              password:
                ownerPassword,
            },
          },
        },
      );

    await markSetupClaimTokenUsed(
      token,
    );

    return NextResponse.json({
      ok: true,

      siteUrl:
        result.siteUrl,

      adminUrl:
        result.adminUrl,

      hostname:
        result.hostname,

      platformHostname:
        result.platformHostname,

      customHostname:
        result.customHostname,

      customDomainPending:
        result.customDomainPending,
    });
  } catch (error) {
    console.error(
      "[SAAS SETUP] Complete failed:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Setup failed.",
      },
      {
        status: 400,
      },
    );
  }
}
