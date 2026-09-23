import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  verifyPassword,
} from "@/lib/auth";
import { redirectTo } from "@/lib/redirect";

export const runtime = "nodejs";

const SESSION_COOKIE = "staark_hub_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  try {
    const contentType =
      request.headers.get("content-type") ?? "";

    let email = "";
    let password = "";

    // React fetch()
    if (contentType.includes("application/json")) {
      const body = await request.json();

      email = String(body.email ?? "")
        .trim()
        .toLowerCase();

      password = String(body.password ?? "");
    }

    // HTML form fallback
    else {
      const formData = await request.formData();

      email = String(
        formData.get("email") ?? ""
      )
        .trim()
        .toLowerCase();

      password = String(
        formData.get("password") ?? ""
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    const passwordValid = await verifyPassword(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          ok: false,
          error: "Access denied.",
        },
        {
          status: 403,
        }
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: "ADMIN",
    });

    /*
     * Dacă request-ul vine de la formularul HTML,
     * facem redirect direct către Hub.
     *
     * Dacă vine prin fetch(), răspundem JSON.
     */
    const isJson =
      contentType.includes("application/json");

    const response = isJson
      ? NextResponse.json({
          ok: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        })
      : redirectTo(
          "/hub",
          request,
          303
        );

    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION,
    });

    return response;
  } catch (error) {
    console.error(
      "Hub login failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Could not sign in.",
      },
      {
        status: 500,
      }
    );
  }
}