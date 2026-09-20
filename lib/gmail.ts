import { google } from "googleapis";

import { prisma } from "@/lib/prisma";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`
    );
  }

  return value;
}

export async function getGmailClient() {
  const settings =
    await prisma.settings.findUnique({
      where: {
        id: "default",
      },
    });

  if (
    !settings?.gmailRefreshToken
  ) {
    throw new Error(
      "Gmail is not connected."
    );
  }

  const oauth2Client =
    new google.auth.OAuth2(
      requiredEnv(
        "GOOGLE_GMAIL_CLIENT_ID"
      ),
      requiredEnv(
        "GOOGLE_GMAIL_CLIENT_SECRET"
      ),
      requiredEnv(
        "GOOGLE_GMAIL_REDIRECT_URI"
      )
    );

  oauth2Client.setCredentials({
    refresh_token:
      settings.gmailRefreshToken,
  });

  const gmail =
    google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

  return {
    gmail,
    settings,
  };
}