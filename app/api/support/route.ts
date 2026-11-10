import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createAdminNotification } from "@/lib/notifications";
import {
  RequestBodyError,
  readBoundedBody,
} from "@/lib/request-body";
import {
  clientIp,
  sameOriginRequest,
} from "@/lib/request-security";
import {
  SUPPORT_MAX_BYTES,
  submitSupportRequest,
} from "@/lib/support-intake";

export const runtime = "nodejs";

function noStore(
  response: NextResponse
): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store"
  );
  return response;
}

function errorResponse(
  status: number,
  error: string,
  headers?: Record<string, string>
) {
  return noStore(
    NextResponse.json(
      {
        error,
      },
      {
        status,
        headers,
      }
    )
  );
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) {
    return errorResponse(
      403,
      "Förfrågan kommer från en annan webbplats."
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await readBoundedBody(
      request,
      SUPPORT_MAX_BYTES
    );
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return errorResponse(
        error.status,
        error.code === "too_large"
          ? "Supportärendet är för stort."
          : error.code === "unsupported"
            ? "Supportärendets format stöds inte."
            : "Kontrollera supportärendets uppgifter."
      );
    }

    console.error(
      "[SUPPORT] Could not read public intake body."
    );

    return errorResponse(
      500,
      "Supportärendet kunde inte skickas. Försök igen."
    );
  }

  try {
    const result = await submitSupportRequest(
      body,
      {
        ip: clientIp(request),
      }
    );

    if (result.kind === "rate_limited") {
      return errorResponse(
        429,
        "För många supportärenden. Vänta en stund och försök igen.",
        {
          "Retry-After": String(
            result.retryAfter
          ),
        }
      );
    }

    if (result.kind === "invalid") {
      return errorResponse(
        400,
        result.message
      );
    }

    if (
      result.created &&
      result.supportRequestId &&
      result.notification
    ) {
      try {
        await createAdminNotification({
          type: "support.created",
          title: "New support request",
          message: `${result.notification.name} – ${result.notification.title}`,
          href: `/hub/support/${result.supportRequestId}`,
          metadata: {
            supportRequestId:
              result.supportRequestId,
            reference: result.reference,
            priority:
              result.notification.priority,
          },
          dedupeKey: `support:${result.supportRequestId}`,
          preference: "support",
        });

        revalidatePath("/hub/support");

        if (result.clientId) {
          revalidatePath(
            `/hub/clients/${result.clientId}`
          );
        }
      } catch (error) {
        // The ticket already exists. A notification failure must not invite
        // the visitor to submit it again.
        console.error(
          "[SUPPORT] Could not publish admin notification.",
          error
        );
      }
    }

    return noStore(
      NextResponse.json({
        ok: true,
        reference: result.reference,
        ...(result.created
          ? {}
          : {
              duplicate: true,
            }),
      })
    );
  } catch (error) {
    console.error(
      "[SUPPORT] Public intake failed.",
      error
    );

    return errorResponse(
      503,
      "Supportärendet kunde inte skickas just nu. Försök igen."
    );
  }
}
