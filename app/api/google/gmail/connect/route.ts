import crypto from "node:crypto";

import { google } from "googleapis";

import { getSession } from "@/lib/auth";
import { redirectTo } from "@/lib/redirect";

const GMAIL_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`
    );
  }

  return value;
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return redirectTo("/hub/login");
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
   * CSRF protection.
   *
   * Callback-ul va trebui să primească
   * exact același state.
   */
  const state =
    crypto.randomBytes(32).toString(
      "hex"
    );

  const loginHint =
    process.env.GOOGLE_GMAIL_ACCOUNT ??
    process.env.CONTACT_TO_EMAIL;

  const authorizationUrl =
    oauth2Client.generateAuthUrl({
      /*
       * Required so we can receive a
       * refresh token and keep Gmail
       * connected while nobody is
       * logged into Hub.
       */
      access_type:
        "offline",

      /*
       * We want the refresh token on
       * this initial connection.
       */
      prompt:
        "consent",

      include_granted_scopes:
        true,

      scope: [
        GMAIL_SCOPE,
      ],

      state,

      ...(loginHint
        ? {
            login_hint:
              loginHint,
          }
        : {}),
    });

  const response =
    Response.redirect(
      authorizationUrl,
      302
    );

  /*
   * Response.redirect() gives a standard
   * Response, so convert it to headers
   * we can attach our secure state cookie to.
   */

  const headers =
    new Headers(response.headers);

  headers.append(
    "Set-Cookie",
    [
      `gmail_oauth_state=${state}`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      "Max-Age=600",
    ].join("; ")
  );

  return new Response(null, {
    status: 302,
    headers,
  });
}