import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(
      new URL("/hub/login", request.url)
    );
  }

  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/hub?ga4=error&reason=no_code", request.url)
    );
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("Google OAuth environment variables missing.");

    return NextResponse.redirect(
      new URL("/hub?ga4=error&reason=config", request.url)
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.error(
        "Google did not return a refresh token."
      );

      return NextResponse.redirect(
        new URL(
          "/hub?ga4=error&reason=no_refresh_token",
          request.url
        )
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
        senderEmail: process.env.SMTP_FROM ?? "info@staarkinc.com",
        ga4RefreshToken: tokens.refresh_token,
        ga4ConnectedAt: new Date(),
      },
    });

    return NextResponse.redirect(
      new URL("/hub?ga4=connected", request.url)
    );
  } catch (error) {
    console.error("Google OAuth callback failed:", error);

    return NextResponse.redirect(
      new URL("/hub?ga4=error&reason=oauth", request.url)
    );
  }
}