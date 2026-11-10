import { NextRequest } from "next/server";

import bcrypt from "bcryptjs";

import {
  updateUserIdentity,
  updateUserPassword,
} from "@/lib/account-security";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectTo } from "@/lib/redirect";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";

const SIDEBAR_OPTIONS = new Set(["standard", "compact"]);
const COUNT_OPTIONS = new Set(["show", "hide"]);
const TIMEZONE_OPTIONS = new Set([
  "Europe/Stockholm",
  "Europe/Bucharest",
  "UTC",
]);

function redirectToProfile(
  request: NextRequest,
  params: string
) {
  return redirectTo(
    `/hub/profile?${params}`,
    request
  );
}

async function rotateCurrentSession(
  response: ReturnType<typeof redirectToProfile>,
  account: {
    id: string;
    email: string;
    role: "ADMIN";
    sessionVersion: number;
  }
) {
  const token = await createSessionToken({
    userId: account.id,
    email: account.email,
    role: "ADMIN",
    sessionVersion: account.sessionVersion,
  });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    ...sessionCookieOptions(),
  });

  return response;
}

export async function POST(
  request: NextRequest
) {
  const session = await getSession();

  if (!session) {
    return redirectToProfile(
      request,
      "error=not_logged_in"
    );
  }

  const formData = await request.formData();

  const action = String(
    formData.get("action") ?? ""
  );

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!user) {
    return redirectToProfile(
      request,
      "error=not_logged_in"
    );
  }

  if (action === "profile") {
    const name = String(
      formData.get("name") ?? ""
    ).trim();

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    if (
      name.length < 2 ||
      name.length > 80 ||
      !email ||
      email.length > 160 ||
      !email.includes("@")
    ) {
      return redirectToProfile(
        request,
        "error=invalid"
      );
    }

    const existingUser =
      await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: user.id,
          },
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      return redirectToProfile(
        request,
        "error=email_exists"
      );
    }

    try {
      const invalidateSessions =
        email !== user.email.toLowerCase();

      const updated = await updateUserIdentity(
        user.id,
        {
          name,
          email,
        },
        {
          invalidateSessions,
        }
      );

      const response = redirectToProfile(
        request,
        "updated=1"
      );

      return invalidateSessions
        ? rotateCurrentSession(
            response,
            updated
          )
        : response;
    } catch (error) {
      console.error(
        "Profile update failed:",
        error
      );

      return redirectToProfile(
        request,
        "error=unknown"
      );
    }
  }

  if (action === "preferences") {
    const sidebar = String(
      formData.get("sidebar") ?? ""
    );
    const counts = String(
      formData.get("counts") ?? ""
    );
    const timezone = String(
      formData.get("timezone") ?? ""
    );

    if (
      !SIDEBAR_OPTIONS.has(sidebar) ||
      !COUNT_OPTIONS.has(counts) ||
      !TIMEZONE_OPTIONS.has(timezone)
    ) {
      return redirectToProfile(
        request,
        "error=invalid"
      );
    }

    const response = redirectToProfile(
      request,
      "preferences=1"
    );

    const cookieOptions = {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };

    response.cookies.set(
      "hub_sidebar",
      sidebar,
      cookieOptions
    );
    response.cookies.set(
      "hub_counts",
      counts,
      cookieOptions
    );
    response.cookies.set(
      "hub_timezone",
      timezone,
      cookieOptions
    );

    return response;
  }

  if (action === "notifications") {
    const notificationPreferences = {
      inbox: formData.get("notifyInbox") === "on",
      leads: formData.get("notifyLeads") === "on",
      offers: formData.get("notifyOffers") === "on",
      support: formData.get("notifySupport") === "on",
      billing: formData.get("notifyBilling") === "on",
    };

    try {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          notificationPreferences,
        },
      });

      return redirectTo(
        "/hub/profile/notifications?notifications=1",
        request
      );
    } catch (error) {
      console.error(
        "Notification preferences update failed:",
        error
      );

      return redirectTo(
        "/hub/profile/notifications?error=unknown",
        request
      );
    }
  }

  if (action === "password") {
    const currentPassword = String(
      formData.get("currentPassword") ?? ""
    );

    const newPassword = String(
      formData.get("newPassword") ?? ""
    );

    const confirmPassword = String(
      formData.get("confirmPassword") ?? ""
    );

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return redirectToProfile(
        request,
        "error=invalid"
      );
    }

    if (newPassword.length < 8) {
      return redirectToProfile(
        request,
        "error=password_length"
      );
    }

    if (
      newPassword !== confirmPassword
    ) {
      return redirectToProfile(
        request,
        "error=password_match"
      );
    }

    const currentPasswordValid =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

    if (!currentPasswordValid) {
      return redirectToProfile(
        request,
        "error=current_password"
      );
    }

    try {
      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      const updated = await updateUserPassword(
        user.id,
        passwordHash
      );

      return rotateCurrentSession(
        redirectToProfile(
          request,
          "password=1"
        ),
        updated
      );
    } catch (error) {
      console.error(
        "Password update failed:",
        error
      );

      return redirectToProfile(
        request,
        "error=unknown"
      );
    }
  }

  return redirectToProfile(
    request,
    "error=invalid"
  );
}
