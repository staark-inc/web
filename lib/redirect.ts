import { NextResponse } from "next/server";

const PUBLIC_URL = (process.env.APP_URL ?? "https://staarkinc.com").replace(/\/+$/, "");

type RedirectStatus = 302 | 303 | 307 | 308;

function firstForwardedValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function getHostname(host: string) {
  try {
    return new URL(`http://${host}`).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function isTrustedHost(host: string) {
  const hostname = getHostname(host);

  return (
    hostname === "staarkinc.com" ||
    hostname.endsWith(".staarkinc.com") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    isPrivateIpv4(hostname)
  );
}

function getRequestOrigin(request?: Request) {
  if (!request) {
    return PUBLIC_URL;
  }

  const forwardedHost = firstForwardedValue(
    request.headers.get("x-forwarded-host")
  );
  const directHost = firstForwardedValue(request.headers.get("host"));
  const host = forwardedHost || directHost;

  if (!host || !isTrustedHost(host)) {
    return PUBLIC_URL;
  }

  const hostname = getHostname(host);
  const forwardedProto = firstForwardedValue(
    request.headers.get("x-forwarded-proto")
  );

  let protocol = forwardedProto === "http" || forwardedProto === "https"
    ? forwardedProto
    : new URL(request.url).protocol.replace(":", "");

  // Reverse proxies can expose the public host while Next sees an internal HTTP URL.
  // Staark public/dev domains should always redirect back through HTTPS.
  if (
    hostname === "staarkinc.com" ||
    hostname.endsWith(".staarkinc.com")
  ) {
    protocol = "https";
  }

  if (protocol !== "http" && protocol !== "https") {
    protocol = "https";
  }

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

  const url = /^https?:\/\//i.test(path)
    ? new URL(path)
    : new URL(path, getRequestOrigin(request));

  return NextResponse.redirect(url, redirectStatus);
}
