import { NextResponse } from "next/server";

const PUBLIC_URL =
  process.env.APP_URL ??
  "https://staarkinc.com";

export function redirectTo(
  path: string,
  status: 303 | 307 | 308 = 303
) {
  const url = new URL(path, PUBLIC_URL);

  return NextResponse.redirect(
    url,
    status
  );
}