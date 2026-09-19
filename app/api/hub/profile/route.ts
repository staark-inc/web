import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function redirectToProfile(
  request: NextRequest,
  params: string
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://192.168.0.10:3010";

  return NextResponse.redirect(
    `${baseUrl}/hub/profile?${params}`,
    303
  );
}

export async function POST(
  request: NextRequest
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(
      new URL("/hub/login", request.url),
      303
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
    return NextResponse.redirect(
      new URL("/hub/login", request.url),
      303
    );
  }

  /**
   * -------------------------------------------------------
   * PROFILE INFORMATION
   * -------------------------------------------------------
   */
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
      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          name,
          email,
        },
      });

      return redirectToProfile(
        request,
        "updated=1"
      );
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

  /**
   * -------------------------------------------------------
   * PASSWORD
   * -------------------------------------------------------
   */
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

      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          passwordHash,
        },
      });

      return redirectToProfile(
        request,
        "password=1"
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