import { NextRequest } from "next/server";
import { google } from "googleapis";

import { getSession } from "@/lib/auth";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  clearOAuthStateCookie,
  validateOAuthState,
} from "@/lib/oauth-state";
import { prisma } from "@/lib/prisma";
import { redirectTo } from "@/lib/redirect";

function finish(
  response: ReturnType<typeof redirectTo>
) {
  clearOAuthStateCookie(response);
  response.headers.set(
    "Cache-Control",
    "no-store"
  );
  return response;
}

function oauthError(
  request: NextRequest,
  reason: string
) {
  return finish(
    redirectTo(
      `/hub?ga4=error&reason=${encodeURIComponent(
        reason
      )}`,
      request
    )
  );
}

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return finish(
      redirectTo("/hub/login", request)
    );
  }

  const oauthErrorCode =
    request.nextUrl.searchParams.get(
      "error"
    );

  if (oauthErrorCode) {
    console.error(
      "Google OAuth was denied or cancelled."
    );

    return oauthError(
      request,
      "denied"
    );
  }

  const code =
    request.nextUrl.searchParams.get("code");

  const receivedState =
    request.nextUrl.searchParams.get("state");

  const cookieValue = request.cookies.get(
    GOOGLE_OAUTH_STATE_COOKIE
  )?.value;

  const stateValidation =
    validateOAuthState(
      cookieValue,
      receivedState
    );

  if (stateValidation !== "valid") {
    console.error(
      "Google OAuth callback state validation failed:",
      stateValidation
    );

    return finish(
      redirectTo(
        "/hub/settings?error=google_oauth_state",
        request
      )
    );
  }

  if (!code) {
    return oauthError(
      request,
      "no_code"
    );
  }

  const clientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error(
      "Google OAuth environment variables missing."
    );

    return oauthError(
      request,
      "config"
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } =
      await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.error(
        "Google did not return a refresh token."
      );

      return oauthError(
        request,
        "no_refresh_token"
      );
    }

    await prisma.settings.upsert({
      where: {
        id: "default",
      },

      update: {
        ga4RefreshToken: tokens.refresh_token,
        ga4ConnectedAt: new Date(),
      },

      create: {
        id: "default",
        senderEmail:
          process.env.SMTP_FROM ??
          "info@staarkinc.com",
        ga4RefreshToken: tokens.refresh_token,
        ga4ConnectedAt: new Date(),
      },
    });

    return finish(
      redirectTo(
        "/hub?ga4=connected",
        request
      )
    );
  } catch {
    // Never log the authorization code or token exchange payload.
    console.error(
      "Google OAuth token exchange failed."
    );

    return oauthError(
      request,
      "oauth"
    );
  }
}
