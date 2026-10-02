import crypto from "node:crypto";

export type RuntimeSiteHealth = {
  reachable: boolean;
  ok: boolean;

  runtime?: {
    status?: string;
    releaseId?: string | null;
    releaseVersion?: string | null;
  };

  database?: {
    ok?: boolean;
  };

  site?: {
    exists: boolean;
    id: string;
    key?: string;
    name?: string;

    setupCompleted?: boolean;
    setupCompletedAt?: string | null;

    pageCount?: number;

    domains?: Array<{
      hostname: string;
      type: string;
      verified: boolean;
      primaryDomain: boolean;
      sslStatus: string;
    }>;

    usage?: {
      storageBytes: string;
      mediaCount: number;
      pagesCount: number;
      submissionsCount: number;
      updatedAt: string;
    } | null;

    subscription?: {
      id: string;
      status: string;
      billingInterval: string;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      updatedAt: string;
      plan: {
        key: string;
        name: string;
      };
    } | null;
  };

  checkedAt?: string;
  error?: string;
};

function runtimeBaseUrl():
  | string
  | null {
  const configured =
    process.env
      .STAARK_RUNTIME_INTERNAL_URL
      ?.trim()
      .replace(/\/+$/, "");

  if (configured) {
    return configured;
  }

  const provisioning =
    process.env
      .STAARK_NEXT_PROVISIONING_URL
      ?.trim();

  if (!provisioning) {
    return null;
  }

  return provisioning.replace(
    /\/api\/staark\/provision\/?$/,
    "",
  );
}

function sign(
  body: string,
  timestamp: string,
  secret: string,
) {
  return crypto
    .createHmac(
      "sha256",
      secret,
    )
    .update(
      `${timestamp}.${body}`,
    )
    .digest("hex");
}

export async function getRuntimeSiteHealth(
  siteId: string | null | undefined,
): Promise<RuntimeSiteHealth | null> {
  if (!siteId) return null;

  const base =
    runtimeBaseUrl();

  const secret =
    process.env
      .STAARK_PROVISIONING_SECRET
      ?.trim();

  if (!base || !secret) {
    return {
      reachable: false,
      ok: false,
      error:
        "Runtime health is not configured.",
    };
  }

  const body =
    JSON.stringify({
      siteId,
    });

  const timestamp =
    Math.floor(
      Date.now() / 1000,
    ).toString();

  try {
    const response =
      await fetch(
        `${base}/api/staark/health`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "X-Staark-Timestamp":
              timestamp,

            "X-Staark-Signature":
              sign(
                body,
                timestamp,
                secret,
              ),
          },

          body,

          cache: "no-store",

          signal:
            AbortSignal.timeout(
              3500,
            ),
        },
      );

    const data =
      (await response
        .json()
        .catch(() => null)) as
        | Omit<
            RuntimeSiteHealth,
            "reachable"
          >
        | null;

    if (!data) {
      return {
        reachable: true,
        ok: false,
        error:
          `Runtime returned HTTP ${response.status}.`,
      };
    }

    return {
      reachable: true,
      ...data,
      ok:
        response.ok &&
        data.ok === true,
    };
  } catch (error) {
    return {
      reachable: false,
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Runtime is unavailable.",
    };
  }
}
