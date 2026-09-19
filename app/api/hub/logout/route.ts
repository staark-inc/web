import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SESSION_COOKIE = "staark_hub_session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(
    new URL("/hub/login", request.url),
    303
  );

  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}