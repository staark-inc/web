import { redirectTo } from "../../../../lib/redirect";

export const runtime = "nodejs";

const SESSION_COOKIE = "staark_hub_session";

export async function POST(request: Request) {
  const response = redirectTo("/hub/login", request);

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