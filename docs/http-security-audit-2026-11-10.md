# SEC-002.8 / SEC-002.9 HTTP security and domain policy

Date: 2026-11-10

Target: `dev`

## Threat model

- An attacker who can spoof `Host`/`X-Forwarded-*` headers tries to influence
  redirects, Host validation, checkout return URLs or Server Action origins.
- A malicious or compromised external URL tries to make the server fetch
  localhost, private networks, cloud metadata or an unapproved domain (SSRF).
- A browser or proxy tries to cache authenticated HTML/API responses.
- A build accidentally ships a database URL, API key, private key or JWT
  secret to the client.
- A reverse proxy and Next.js disagree about security headers or HTTPS.

## Audit findings

### Already correct and preserved

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` for camera, microphone and geolocation
- HSTS in production
- `poweredByHeader: false`
- No application `Access-Control-Allow-Origin` headers on authenticated APIs
- CSP already enforced with explicit Google Analytics/Ads allowances
- Public HTML caching is limited to the known static page/image sets
- WordPress connector requests are HMAC-signed with timestamp checks
- Stripe webhooks use Stripe signatures rather than a session cookie

The CSP is already enforced and has been exercised by the public, Google Ads
and Hub browser suites. This change does **not** tighten script execution and
therefore does not introduce a Report-Only rollout. A future nonce-based CSP
would need a Report-Only phase first.

### Added

- `Cache-Control: private, no-store, max-age=0, must-revalidate` for
  `/hub/*`, `/api/hub/*`, `/api/saas/*`, `/offert/*`, `/saas/setup/*` and
  `/saas/checkout/*`.
- `Cross-Origin-Opener-Policy: same-origin` on private pages.
- Explicit Server Actions `allowedOrigins` derived from the environment
  allowlist; wildcards are never emitted.
- Production HTTPS redirect in `proxy.ts`.
- Host validation for `/hub` and `/api/hub` in production; invalid Host gets
  HTTP 421.
- Central `lib/network-policy.ts` for origins, hosts, private-address checks,
  HTTPS enforcement and configured-service validation.
- `safeExternalFetch()` with manual redirect validation and DNS resolution
  checks for public external targets.
- WordPress release fetching now requires HTTPS, an approved GitHub/CDN host,
  a public DNS result and no more than three redirects.
- `scripts/check-secret-exposure.mjs` scans built client bundles and `public/`
  for database URLs, Stripe/GitHub/Google keys, private keys, secret-like
  public files and sensitive `NEXT_PUBLIC_*` names.

## Environment policy

| Variable | Purpose |
|---|---|
| `APP_URL` | Canonical app origin; also used for redirects |
| `STAARK_ALLOWED_ORIGINS` | Comma-separated extra trusted browser origins |
| `STAARK_ALLOWED_HOSTS` | Comma-separated extra trusted Host values |
| `STAARK_TRUST_PROXY_HEADERS=1` | Trust `CF-Connecting-IP`, `X-Real-IP`, `X-Forwarded-Proto`/`Host` from the proxy |
| `STAARK_ENFORCE_HTTPS=0` | Emergency escape hatch for the production HTTPS redirect |
| `ALLOW_PRIVATE_SERVICE_URLS=1` | Permit a non-allowlisted service URL to use a private network |

The following explicitly configured internal service names are allowed to use
private HTTP targets in production because they are deployment configuration,
not user input: `DEMO_MANAGER_URL`, `REALTIME_URL`,
`STAARK_NEXT_PROVISIONING_URL`, `STAARK_RUNTIME_INTERNAL_URL`.

Production origins are `https://staarkinc.com` and
`https://www.staarkinc.com`. Staging `https://dev.staarkinc.com` and local
origins are included outside production, or when `APP_URL`/`STAARK_ALLOWED_ORIGINS`
explicitly adds them.

## SSRF scope

Public integrations use fixed HTTPS hosts (Google APIs, GitHub, Stripe).
User input cannot choose those hosts. The WordPress release endpoint accepts a
deployment-configured manifest URL; it is now validated at runtime. Internal
SaaS, realtime and demo-manager URLs are deployment-configured and explicitly
documented as private-network exceptions.

The checks reject loopback, private IPv4/IPv6, link-local, CGNAT, multicast,
documentation ranges, `.local`/`.internal` names and cloud metadata hosts.
DNS is resolved before public external fetches; redirects are revalidated.
DNS rebinding is reduced by host allowlists but not completely eliminated
without a socket-level resolver. Do not use `safeExternalFetch` for arbitrary
user-supplied hosts without a per-feature allowlist.

## Compatibility risks

- Production must set `APP_URL` and, behind Cloudflare, `STAARK_TRUST_PROXY_HEADERS=1`.
  Without the proxy flag, forwarded Host/Proto are ignored and HTTPS redirects
  fall back to the direct request.
- `STAARK_ALLOWED_ORIGINS`/`STAARK_ALLOWED_HOSTS` are required for additional
  custom Hub hostnames. The default production host is `staarkinc.com`.
- Server Actions sent through a proxy need that proxy host in the allowlist.
- `safeExternalFetch` performs DNS resolution; deployments without outbound
  DNS cannot fetch WordPress releases.
- Emergency use of `STAARK_ENFORCE_HTTPS=0` weakens transport enforcement and
  should be temporary.

## Verification

- `npm run test:http-security` — header, origin, Host, HTTPS, private-address,
  external URL and configured-service tests.
- `npm run check:secret-exposure` after `npm run build`.
- Existing `test:security-seo`, public browser, Google Ads and Hub browser
  suites.
- Staging checks:
  1. Confirm HTTP redirects to HTTPS and HSTS is present.
  2. Confirm `Cache-Control` contains `no-store` on `/hub`, `/api/hub/*` and
     `/api/saas/*`.
  3. Confirm `Host: evil.example` to `/hub` returns 421.
  4. Confirm the WordPress release endpoint still returns a manifest.
  5. Confirm Google OAuth, GitHub, Stripe, Gmail and realtime integrations.

## Deployment and rollback

1. Set `APP_URL`, `STAARK_TRUST_PROXY_HEADERS=1` behind the trusted proxy and
   any required `STAARK_ALLOWED_ORIGINS`/`STAARK_ALLOWED_HOSTS`.
2. Deploy the image.
3. Run the staging checks above.
4. Roll back by reverting the PR. No database migration is part of this
   change. If HTTPS redirect or Host validation blocks an unexpected proxy,
   set `STAARK_ENFORCE_HTTPS=0` only as an emergency mitigation and restore the
   correct proxy configuration.
