export type SecurityEnvironment = Record<
  string,
  string | undefined
>;

const PRODUCTION_ORIGINS = [
  "https://staarkinc.com",
  "https://www.staarkinc.com",
];

const STAGING_ORIGINS = [
  "https://dev.staarkinc.com",
];

const LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://[::1]:3000",
];

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function configuredOrigins(
  env: SecurityEnvironment = process.env
): string[] {
  return unique(
    [
      env.APP_URL,
      env.NEXT_PUBLIC_SITE_URL,
      env.SAAS_PUBLIC_ORIGIN,
      ...(env.STAARK_ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((value) => value.trim()),
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => {
        try {
          return new URL(value).origin;
        } catch {
          return "";
        }
      })
      .filter(Boolean)
  );
}

function isLoopbackOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

export function allowedOrigins(
  env: SecurityEnvironment = process.env
): string[] {
  const configured = configuredOrigins(env);
  const origins = [
    ...PRODUCTION_ORIGINS,
    ...configured,
  ];

  // A loopback APP_URL is an explicit local/test configuration. Never infer
  // it from a production hostname.
  if (configured.some(isLoopbackOrigin)) {
    origins.push(...LOCAL_ORIGINS);
  }

  if (
    env.NODE_ENV !== "production" ||
    env.STAARK_ENABLE_STAGING_ORIGINS === "1"
  ) {
    origins.push(
      ...STAGING_ORIGINS,
      ...LOCAL_ORIGINS
    );
  }

  return unique(origins);
}

export function normalizeOrigin(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(
  value: string | null | undefined,
  env: SecurityEnvironment = process.env
): boolean {
  const origin = normalizeOrigin(value);
  return Boolean(
    origin && allowedOrigins(env).includes(origin)
  );
}

export function trustedProxyHeadersEnabled(
  env: SecurityEnvironment = process.env
): boolean {
  return (
    env.STAARK_TRUST_PROXY_HEADERS === "1" ||
    env.CONTACT_TRUST_PROXY_HEADERS === "1"
  );
}

export function requestProtocol(
  request: Request,
  env: SecurityEnvironment = process.env
): "http" | "https" {
  const forwarded = trustedProxyHeadersEnabled(env)
    ? firstHeaderValue(
        request.headers.get("x-forwarded-proto")
      )
    : null;

  if (forwarded === "http" || forwarded === "https") {
    return forwarded;
  }

  return new URL(request.url).protocol === "https:"
    ? "https"
    : "http";
}

export function requestHost(
  request: Request,
  env: SecurityEnvironment = process.env
): string | null {
  const forwarded = trustedProxyHeadersEnabled(env)
    ? firstHeaderValue(
        request.headers.get("x-forwarded-host")
      )
    : null;

  const host =
    forwarded ||
    firstHeaderValue(request.headers.get("host")) ||
    new URL(request.url).host;

  return host?.trim().toLowerCase() || null;
}

export function allowedHosts(
  env: SecurityEnvironment = process.env
): string[] {
  const hosts = allowedOrigins(env).map(
    (origin) => new URL(origin).host.toLowerCase()
  );

  for (const configured of (
    env.STAARK_ALLOWED_HOSTS ?? ""
  ).split(",")) {
    const value = configured.trim().toLowerCase();
    if (value) hosts.push(value);
  }

  return unique(hosts);
}

export function isAllowedHost(
  host: string | null | undefined,
  env: SecurityEnvironment = process.env
): boolean {
  if (!host) return false;

  const normalized = host
    .trim()
    .toLowerCase()
    .replace(/:(?:80|443)$/, "");

  return allowedHosts(env).includes(normalized);
}

export function isAllowedExternalRedirect(
  value: string,
  approvedHosts: string[]
): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      approvedHosts
        .map((host) => host.toLowerCase())
        .includes(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export function httpsRedirectUrl(
  request: Request,
  env: SecurityEnvironment = process.env
): string | null {
  if (
    env.NODE_ENV !== "production" ||
    env.STAARK_ENFORCE_HTTPS === "0" ||
    requestProtocol(request, env) === "https"
  ) {
    return null;
  }

  const host = requestHost(request, env);

  if (!host || !isAllowedHost(host, env)) {
    return null;
  }

  const url = new URL(request.url);
  return `https://${host}${url.pathname}${url.search}`;
}

export function serverActionAllowedOrigins(
  env: SecurityEnvironment = process.env
): string[] {
  return unique(
    allowedOrigins(env)
      .map((origin) => new URL(origin).host)
      .filter((host) => host && host !== "*")
  );
}

export {
  LOCAL_ORIGINS,
  PRODUCTION_ORIGINS,
  STAGING_ORIGINS,
};
