import assert from "node:assert/strict";
import { test } from "node:test";

import config from "../next.config.ts";
import {
  allowedOrigins,
  assertConfiguredServiceUrl,
  assertPublicHttpsUrl,
  httpsRedirectUrl,
  isAllowedExternalRedirect,
  isAllowedHost,
  isPrivateAddress,
  serverActionAllowedOrigins,
} from "../lib/network-policy.ts";

function headerMap(rule: {
  headers: Array<{ key: string; value: string }>;
}) {
  return Object.fromEntries(
    rule.headers.map(({ key, value }) => [key, value])
  );
}

test("private routes are non-cacheable and global headers retain the baseline protections", async () => {
  const rules = await config.headers!();
  const global = headerMap(
    rules.find((rule) => rule.source === "/:path*")!
  );

  assert.equal(
    global["X-Content-Type-Options"],
    "nosniff"
  );
  assert.equal(
    global["X-Frame-Options"],
    "SAMEORIGIN"
  );
  assert.equal(
    global["Referrer-Policy"],
    "strict-origin-when-cross-origin"
  );
  assert.equal(
    global["Strict-Transport-Security"],
    "max-age=31536000"
  );
  assert.match(
    global["Permissions-Policy"],
    /camera=\(\)/
  );
  assert.match(
    global["Content-Security-Policy"],
    /object-src 'none'/
  );
  assert.doesNotMatch(
    global["Content-Security-Policy"],
    /unsafe-eval/
  );
  assert.ok(!("Access-Control-Allow-Origin" in global));

  for (const source of [
    "/hub/:path*",
    "/offert/:path*",
    "/saas/setup/:path*",
    "/saas/checkout/:path*",
    "/api/hub/:path*",
    "/api/saas/:path*",
  ]) {
    const headers = headerMap(
      rules.find((rule) => rule.source === source)!
    );
    assert.match(
      headers["Cache-Control"],
      /no-store/
    );
    assert.match(
      headers["X-Robots-Tag"],
      /noindex/
    );
  }

  assert.equal(config.poweredByHeader, false);
  assert.equal(config.compress, true);
  assert.equal(config.generateEtags, true);

  const actionOrigins =
    config.experimental?.serverActions
      ?.allowedOrigins ?? [];
  assert.ok(actionOrigins.length > 0);
  assert.ok(
    actionOrigins.includes("staarkinc.com")
  );
  assert.ok(!actionOrigins.includes("*"));
});

test("production, staging and local origins are separated", () => {
  const production = allowedOrigins({
    NODE_ENV: "production",
  });
  assert.ok(production.includes("https://staarkinc.com"));
  assert.ok(
    production.includes("https://www.staarkinc.com")
  );
  assert.ok(
    !production.includes("http://localhost:3000")
  );
  assert.ok(
    !production.includes("https://dev.staarkinc.com")
  );

  const staging = allowedOrigins({
    NODE_ENV: "production",
    APP_URL: "https://dev.staarkinc.com",
  });
  assert.ok(
    staging.includes("https://dev.staarkinc.com")
  );

  const development = allowedOrigins({
    NODE_ENV: "development",
  });
  assert.ok(
    development.includes("http://localhost:3000")
  );
  assert.ok(
    development.includes("https://dev.staarkinc.com")
  );

  const loopbackProduction = allowedOrigins({
    NODE_ENV: "production",
    APP_URL: "http://127.0.0.1:3000",
  });
  assert.ok(
    loopbackProduction.includes("http://localhost:3000")
  );
  assert.ok(
    loopbackProduction.includes("http://127.0.0.1:3000")
  );

  assert.equal(
    isAllowedHost("staarkinc.com", {
      NODE_ENV: "production",
    }),
    true
  );
  assert.equal(
    isAllowedHost("staarkinc.com:443", {
      NODE_ENV: "production",
    }),
    true
  );
  assert.equal(
    isAllowedHost("evil.example", {
      NODE_ENV: "production",
    }),
    false
  );
  assert.equal(
    isAllowedHost("127.0.0.1:3000", {
      NODE_ENV: "production",
    }),
    false
  );

  const actions = serverActionAllowedOrigins({
    NODE_ENV: "production",
  });
  assert.ok(actions.includes("staarkinc.com"));
  assert.ok(!actions.includes("*"));
});

test("HTTPS redirects use the trusted forwarded protocol and approved hosts", () => {
  const request = new Request(
    "http://internal:3000/hub?tab=email",
    {
      headers: {
        host: "staarkinc.com",
      },
    }
  );

  assert.equal(
    httpsRedirectUrl(request, {
      NODE_ENV: "production",
    }),
    "https://staarkinc.com/hub?tab=email"
  );

  const forwarded = new Request(
    "http://internal:3000/hub",
    {
      headers: {
        host: "internal",
        "x-forwarded-host": "staarkinc.com",
        "x-forwarded-proto": "https",
      },
    }
  );

  assert.equal(
    httpsRedirectUrl(forwarded, {
      NODE_ENV: "production",
      STAARK_TRUST_PROXY_HEADERS: "1",
    }),
    null
  );

  const evil = new Request(
    "http://internal:3000/hub",
    {
      headers: {
        host: "evil.example",
      },
    }
  );

  assert.equal(
    httpsRedirectUrl(evil, {
      NODE_ENV: "production",
    }),
    null
  );

  assert.equal(
    httpsRedirectUrl(request, {
      NODE_ENV: "development",
    }),
    null
  );
});

test("private, loopback, link-local and metadata addresses are rejected", () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "100.64.0.1",
    "169.254.169.254",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fd00::1",
    "fe80::1",
    "2001:db8::1",
  ]) {
    assert.equal(
      isPrivateAddress(address),
      true,
      address
    );
  }

  for (const address of [
    "8.8.8.8",
    "1.1.1.1",
    "2606:4700:4700::1111",
  ]) {
    assert.equal(
      isPrivateAddress(address),
      false,
      address
    );
  }
});

test("external URLs require HTTPS, approved hosts and no credentials", () => {
  assert.throws(() =>
    assertPublicHttpsUrl("http://api.github.com")
  );
  assert.throws(() =>
    assertPublicHttpsUrl(
      "https://user:pass@api.github.com"
    )
  );
  assert.throws(() =>
    assertPublicHttpsUrl(
      "https://127.0.0.1/secret"
    )
  );
  assert.throws(() =>
    assertPublicHttpsUrl(
      "https://169.254.169.254/latest/meta-data"
    )
  );
  assert.throws(() =>
    assertPublicHttpsUrl(
      "https://metadata.google.internal/"
    )
  );
  assert.throws(() =>
    assertPublicHttpsUrl("https://evil.example/", {
      allowedHosts: ["api.github.com"],
    })
  );

  assert.equal(
    assertPublicHttpsUrl(
      "https://api.github.com/repos/x/y",
      {
        allowedHosts: ["api.github.com"],
      }
    ).hostname,
    "api.github.com"
  );

  assert.equal(
    isAllowedExternalRedirect(
      "https://accounts.google.com/o/oauth2/v2/auth",
      ["accounts.google.com"]
    ),
    true
  );
  assert.equal(
    isAllowedExternalRedirect(
      "https://evil.example/oauth",
      ["accounts.google.com"]
    ),
    false
  );
});

test("configured internal services require an explicit private-network exception in production", () => {
  const env = {
    NODE_ENV: "production",
  };

  assert.throws(() =>
    assertConfiguredServiceUrl(
      "http://10.0.0.10:8080/health",
      "CUSTOM_SERVICE_URL",
      env
    )
  );

  assert.doesNotThrow(() =>
    assertConfiguredServiceUrl(
      "http://10.0.0.10:8080/health",
      "STAARK_RUNTIME_INTERNAL_URL",
      env
    )
  );

  assert.doesNotThrow(() =>
    assertConfiguredServiceUrl(
      "http://10.0.0.10:8080/health",
      "CUSTOM_SERVICE_URL",
      {
        NODE_ENV: "production",
        ALLOW_PRIVATE_SERVICE_URLS: "1",
      }
    )
  );

  assert.doesNotThrow(() =>
    assertConfiguredServiceUrl(
      "http://127.0.0.1:4000/health",
      "REALTIME_URL",
      {
        NODE_ENV: "development",
      }
    )
  );
});
