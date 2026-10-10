import assert from "node:assert/strict";
import { test } from "node:test";
import config from "../next.config.ts";

test("production security headers protect HTML and allow hydration/consented analytics", async () => {
  const rules = await config.headers!();
  const headers = Object.fromEntries(rules.find((rule) => rule.source === "/:path*")!.headers.map(({ key, value }) => [key, value]));
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "SAMEORIGIN");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["Strict-Transport-Security"], "max-age=31536000");
  const csp = headers["Content-Security-Policy"];
  assert.match(csp, /frame-ancestors 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /form-action 'self'/);
  assert.match(csp, /https:\/\/www\.googletagmanager\.com/);
  assert.match(csp, /https:\/\/\*\.google-analytics\.com/);
  const connectSources = csp.split(";").find((directive) => directive.trim().startsWith("connect-src "))!.trim().split(/\s+/).slice(1);
  assert.ok(connectSources.includes("https://stats.g.doubleclick.net"), "Google Analytics advertising collection must not be blocked");
  assert.ok(connectSources.includes("https://googleads.g.doubleclick.net"), "Google Ads conversions must remain allowed");
  assert.ok(!connectSources.includes("https:") && !connectSources.includes("*"), "Connection origins remain explicitly restricted");
  assert.doesNotMatch(csp, /unsafe-eval|upgrade-insecure-requests/);
});

test("private routes have noindex headers and mutable public assets can revalidate", async () => {
  const rules = await config.headers!();
  for (const source of ["/hub/:path*", "/offert/:path*", "/saas/setup/:path*", "/saas/checkout/:path*"]) {
    assert.ok(rules.find((rule) => rule.source === source)!.headers.some((header) => header.key === "X-Robots-Tag" && header.value.includes("noindex")));
  }
  for (const rule of rules.filter((rule) => rule.source.includes("figma-v2") || rule.source.includes("svg|ico"))) {
    const cache = rule.headers.find((header) => header.key === "Cache-Control")!.value;
    assert.doesNotMatch(cache, /immutable/);
    assert.match(cache, /must-revalidate/);
  }
  assert.equal(config.compress, true);
  assert.equal(config.generateEtags, true);
  assert.equal(config.poweredByHeader, false);
});
