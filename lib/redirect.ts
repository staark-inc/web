import { NextResponse } from "next/server";

import {
  isAllowedExternalRedirect,
  isAllowedHost,
  requestHost,
  requestProtocol,
} from "@/lib/origin-policy";

const PUBLIC_URL = (process.env.APP_URL ?? "https://staarkinc.com").replace(/\/+$/, "");

const EXTERNAL_REDIRECT_HOSTS = [
  "accounts.google.com",
  "checkout.stripe.com",
];

type RedirectStatus = 302 | 303 | 307 | 308;

function getRequestOrigin(request?: Request) {
  if (!request) {
    return PUBLIC_URL;
  }

  const host = requestHost(request);

  if (!host || !isAllowedHost(host)) {
    return PUBLIC_URL;
  }

  const hostname = host.split(":")[0];
  const protocol =
    hostname === "staarkinc.com" ||
    hostname.endsWith(".staarkinc.com")
      ? "https"
      : requestProtocol(request);

  return `${protocol}://${host}`;
}

export function redirectTo(
  path: string,
  requestOrStatus?: Request | RedirectStatus,
  status: RedirectStatus = 303
) {
  const request =
    typeof requestOrStatus === "number" ? undefined : requestOrStatus;
  const redirectStatus =
    typeof requestOrStatus === "number" ? requestOrStatus : status;

  if (/^https?:\/\//i.test(path)) {
    if (
      !isAllowedExternalRedirect(
        path,
        EXTERNAL_REDIRECT_HOSTS
      )
    ) {
      throw new Error(
        "Redirect target is not an approved external origin."
      );
    }

    return NextResponse.redirect(
      new URL(path),
      redirectStatus
    );
  }

  return NextResponse.redirect(
    new URL(path, getRequestOrigin(request)),
    redirectStatus
  );
}
