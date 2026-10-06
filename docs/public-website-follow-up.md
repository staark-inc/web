# Public website rendering, contact protection and accessibility

## SaaS rendering

The previous `/saas` page suspended its entire content on `useSearchParams` with
a null fallback, so its built HTML had no H1 or pricing cards. The route now
renders its presentation on the server and prerenders the interactive pricing
component with initial values supplied by the server. `billing=year` and the
supported promotion links keep working before hydration. Header/footer match
the rest of the public site.

This route is now request-rendered because it reads search parameters. It is
intentionally excluded from the static HTML validator logic. No checkout is
started during rendering; checkout remains an explicit button action.

## Contact endpoint

- Bound both declared and actual streamed request bodies to 64 KiB, including
  chunked requests. Continue to accept JSON, URL encoded and multipart forms.
- Reject malformed data with 400, oversized bodies with 413 and unsupported
  formats with 415 before SMTP/database access.
- Reject foreign browser origins and cross-site Fetch Metadata submissions.
  No-Origin clients remain supported for existing non-browser integrations.
- A `fax` honeypot acknowledges submissions without sending email or saving
  a lead when populated. The normal browser form sends it empty.
- Enforce 60 requests/minute per process and 3 validated submissions/email per
  10 minutes. Keys hash normalized email addresses. Entries expire and storage
  is bounded. Return 429 and Retry-After; keep the visitor's form text for retry.
- Optional per-IP control allows 5 requests/10 minutes. Enable
  `CONTACT_TRUST_PROXY_HEADERS=1` **only** when Cloudflare overwrites
  CF-Connecting-IP and the origin cannot be reached directly by callers.
  Caller-supplied X-Forwarded-For is never trusted.

The limiter is process-local and resets on restart. It is a baseline for the
current single-process deployment, not a distributed abuse prevention system.
Use Cloudflare rate limiting or a shared store if the application is scaled.

## Accessibility

The mobile menu exposes its controlled navigation and current page, focuses
the first link when opened, and closes with Escape while restoring focus.
The cookie dialog receives focus, contains keyboard focus, locks background
scrolling and restores the opener when closed. Escape can dismiss reopened
settings when a choice already exists; it never silently grants consent.
Consent storage uses useSyncExternalStore instead of synchronous setState in
mount effects. Reduced-motion users get no smooth scrolling/button movement.

## HTTP validators and expiration

Next still generates its normal ETag. Cloudflare may remove or weaken ETag
when rewriting HTML; see its ETag reference below.

Static public HTML also receives a real deployment-build Last-Modified value,
inlined into the compiled proxy. A matching If-Modified-Since returns a
body-free 304 with cache headers. An older validator returns 200. A new build
gets a new timestamp, even if sitemap content dates are unchanged, so previous
HTML referring to obsolete Next chunks is not reused across builds.

If-None-Match takes precedence and is left to Next. RSC, router navigation and
prefetch requests bypass this HTML conditional path. The route allowlist uses
only known published pages/slugs; unknown pages, API, Hub, offers and dynamic
SaaS routes never get these static validators or 304 shortcuts.

HTML Expires matches `max-age=0` (revalidate in the browser); the existing
one-year shared-cache setting is preserved. Named public images receive an
Expires value one hour after the request, matching their one-hour Cache-Control.
Private responses and fingerprinted Next chunks retain their own policy.
Cache-Control takes precedence over Expires; the latter is compatibility metadata.

The validator is scoped to public pages whose content is backed by this code
build. If one later starts reading live content from a database/API, remove it
from the allowlist or switch to a validator tied to that content revision.

## Verification

```sh
npm run test:public-website
npm run test:security-seo
npm run test:news
npm run build
npm run typecheck
npx playwright install chromium
# With the production server running:
npm run check:security-seo
npm run check:public-browser
```

The browser checks exercise mobile menu/dialog focus, monthly/yearly pricing,
promo query initialization and no-JavaScript SaaS content. Contact and checkout
requests in browser tests are mocked; no email, lead or payment is created.
HTTP checks use only malformed, oversized, foreign-origin and honeypot contact
requests, which exit before real SMTP/database work.

After deployment, rerun HTTP checks against the edge and verify Last-Modified
and conditional 304 responses survived Cloudflare transformations. The browser
checker is intended for a local/staging production server, not live payments.

Reference: https://developers.cloudflare.com/cache/reference/etag-headers/

## Public content discovery

Added Swedish `/llms.txt` and an AI Catalog 1.0 document at `/ai-catalog.json`, also discoverable via `/.well-known/ai-catalog.json` and HTTP Link headers. The catalog references the public Markdown overview and does not advertise nonexistent MCP servers or agents. These are discovery conventions, not guaranteed Google ranking improvements. The homepage local links now have explicit city/service titles and distinct visible descriptions. HTTP checks verify discovery files, media types and every overview link.

Local Chromium installation was blocked by truncated browser downloads in the execution environment. The browser regression suite is configured in GitHub Actions; local unit, build and HTTP verification are independent of that download.
