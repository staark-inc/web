import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/rate-limit";
import {
  RequestBodyError,
  readBoundedBody,
} from "@/lib/request-body";
import {
  clientIp,
  hashIdentifier,
  sameOriginRequest,
} from "@/lib/request-security";
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
  if (!sameOriginRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Setup is not allowed from this origin.",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const globalLimit =
      await consumeRateLimit({
        key: "saas:setup:global",
        limit: 100,
        windowMs: 60 * 60 * 1000,
      });

    if (!globalLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Too many setup attempts. Try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              globalLimit.retryAfter,
            ),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const ip = clientIp(request);

    if (ip) {
      const ipLimit =
        await consumeRateLimit({
          key: `saas:setup:ip:${hashIdentifier(
            ip,
          )}`,
          limit: 20,
          windowMs: 60 * 60 * 1000,
        });

      if (!ipLimit.allowed) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Too many setup attempts. Try again later.",
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(
                ipLimit.retryAfter,
              ),
              "Cache-Control": "no-store",
            },
          },
        );
      }
    }

    const body = await readBoundedBody(
      request,
      64 * 1024,
    );

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
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error.code === "too_large"
              ? "Request body is too large."
              : error.code === "unsupported"
                ? "Unsupported content type."
                : "Could not read the setup request.",
        },
        {
          status: error.status,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

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
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
