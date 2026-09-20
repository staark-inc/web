import crypto from "node:crypto";

import { google } from "googleapis";
import { cookies } from "next/headers";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectTo } from "@/lib/redirect";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`
    );
  }

  return value;
}

function safeStateEqual(
  expected: string,
  received: string
) {
  try {
    const expectedBuffer =
      Buffer.from(expected, "utf8");

    const receivedBuffer =
      Buffer.from(received, "utf8");

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );
  } catch {
    return false;
  }
}

export async function GET(
  request: Request
) {
  const session =
    await getSession();

  if (!session) {
    return redirectTo(
      "/hub/login"
    );
  }

  try {
    const url =
      new URL(request.url);

    const oauthError =
      url.searchParams.get(
        "error"
      );

    if (oauthError) {
      console.error(
        "[GMAIL] OAuth denied:",
        oauthError
      );

      return redirectTo(
        "/hub/inbox?gmail=denied"
      );
    }

    const code =
      url.searchParams.get(
        "code"
      );

    const receivedState =
      url.searchParams.get(
        "state"
      );

    const cookieStore =
      await cookies();

    const expectedState =
      cookieStore.get(
        "gmail_oauth_state"
      )?.value;

    /*
     * Validate CSRF state.
     */

    if (
      !code ||
      !receivedState ||
      !expectedState ||
      !safeStateEqual(
        expectedState,
        receivedState
      )
    ) {
      console.error(
        "[GMAIL] Invalid OAuth callback state"
      );

      const response =
        redirectTo(
          "/hub/inbox?gmail=invalid_state"
        );

      response.cookies.delete(
        "gmail_oauth_state"
      );

      return response;
    }

    const clientId =
      requiredEnv(
        "GOOGLE_GMAIL_CLIENT_ID"
      );

    const clientSecret =
      requiredEnv(
        "GOOGLE_GMAIL_CLIENT_SECRET"
      );

    const redirectUri =
      requiredEnv(
        "GOOGLE_GMAIL_REDIRECT_URI"
      );

    const oauth2Client =
      new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

    /*
     * Exchange authorization code
     * for Google tokens.
     */

    const {
      tokens,
    } =
      await oauth2Client.getToken(
        code
      );

    oauth2Client.setCredentials(
      tokens
    );

    /*
     * Verify which Gmail mailbox
     * was actually authorized.
     */

    const gmail =
      google.gmail({
        version: "v1",
        auth: oauth2Client,
      });

    const profile =
      await gmail.users.getProfile({
        userId: "me",
      });

    const connectedEmail =
      profile.data.emailAddress
        ?.trim()
        .toLowerCase();

    const expectedEmail =
      (
        process.env
          .GOOGLE_GMAIL_ACCOUNT ??
        process.env
          .CONTACT_TO_EMAIL ??
        ""
      )
        .trim()
        .toLowerCase();

    if (!connectedEmail) {
      throw new Error(
        "Google did not return the Gmail account email."
      );
    }

    /*
     * Prevent accidentally connecting
     * the wrong Google account.
     */

    if (
      expectedEmail &&
      connectedEmail !==
        expectedEmail
    ) {
      console.error(
        `[GMAIL] Wrong account authorized. Expected ${expectedEmail}, received ${connectedEmail}`
      );

      const response =
        redirectTo(
          "/hub/inbox?gmail=wrong_account"
        );

      response.cookies.delete(
        "gmail_oauth_state"
      );

      return response;
    }

    /*
     * Google may only return a refresh
     * token on initial authorization.
     *
     * If one already exists in Settings,
     * preserve it.
     */

    const existingSettings =
      await prisma.settings.findUnique({
        where: {
          id: "default",
        },
      });

    const refreshToken =
      tokens.refresh_token ??
      existingSettings
        ?.gmailRefreshToken ??
      null;

    if (!refreshToken) {
      console.error(
        "[GMAIL] No refresh token returned"
      );

      const response =
        redirectTo(
          "/hub/inbox?gmail=no_refresh_token"
        );

      response.cookies.delete(
        "gmail_oauth_state"
      );

      return response;
    }

    /*
     * Store the refresh token securely
     * in the database.
     */

    await prisma.settings.upsert({
      where: {
        id: "default",
      },

      update: {
        gmailRefreshToken:
          refreshToken,

        gmailConnectedAt:
          new Date(),
      },

      create: {
        id: "default",

        senderName:
          "Staark Inc.",

        senderEmail:
          requiredEnv(
            "CONTACT_FROM_EMAIL"
          ),

        gmailRefreshToken:
          refreshToken,

        gmailConnectedAt:
          new Date(),
      },
    });

    console.log(
      `[GMAIL] Connected successfully: ${connectedEmail}`
    );

    const response =
      redirectTo(
        "/hub/inbox?gmail=connected"
      );

    response.cookies.delete(
      "gmail_oauth_state"
    );

    return response;
  } catch (error) {
    console.error(
      "[GMAIL] OAuth callback failed:",
      error
    );

    const response =
      redirectTo(
        "/hub/inbox?gmail=error"
      );

    response.cookies.delete(
      "gmail_oauth_state"
    );

    return response;
  }
}