import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(
      new URL(
        "/hub/login",
        process.env.GOOGLE_OAUTH_REDIRECT_URI!
      )
    );
  }

  const clientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID;

  const clientSecret =
    process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
    return NextResponse.json(
      {
        error:
          "Google OAuth configuration missing.",
      },
      {
        status: 500,
      }
    );
  }

  const oauth2Client =
    new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

  const url =
    oauth2Client.generateAuthUrl({
      access_type: "offline",

      // Important:
      // force Google to show the consent screen again
      // so we can receive permission for Search Console.
      prompt: "consent",

      scope: [
        // Google Analytics
        "https://www.googleapis.com/auth/analytics.readonly",

        // Google Search Console
        "https://www.googleapis.com/auth/webmasters.readonly",
      ],
    });

  return NextResponse.redirect(url);
}