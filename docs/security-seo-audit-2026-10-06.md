# Security and SEO audit follow-up (6 October 2026)

The attached audit rated the homepage 80/100, with two errors and eleven warnings.
This patch addresses application-level findings while preserving static public pages.

## Changes

- Next.js and its ESLint config updated from 16.3.4 to 16.3.6, addressing
  GHSA-vcvr-r3jv-pc5j in Node.js ImageResponse. The new social images use fixed
  content and accept no attacker-controlled SVG/styles. Nodemailer updated
  to 10.0.15 to include its current SMTP/address parser security fixes.
- Refresh the transitive source-map-js dependency from 1.2.1 to 1.2.2.
- Global CSP, HSTS, MIME sniffing protection, same-origin framing, referrer policy
  and permissions policy. HSTS does not include subdomains or preload: those
  require verifying every sibling domain. Development allows eval and WebSockets;
  production does not. HTTP LAN development remains supported.
- CSP explicitly permits consent-gated Google Analytics and Cloudflare Insights.
  The current application uses same-origin SSE and does not embed external frames.
  Public remote images remain supported, including images in email/news content.
- The static CSP retains `unsafe-inline` for Next.js hydration and existing inline
  styles. It is **not** a nonce-based XSS policy. A strict nonce rollout requires
  a separate rendering/caching change, especially for authenticated Hub pages.
- File-based Open Graph/Twitter PNG images with a large Twitter card, a more
  descriptive homepage title, canonical/metadata and sitemap coverage for SaaS.
  Legal pages retain their existing noindex policy and stay outside the sitemap.
- Sitemap `lastmod` for static/service/project pages comes from Git history of
  the route and shared page dependencies. Blog entries retain their explicit
  publication/update dates. `npm run prebuild` refreshes the committed manifest
  in a checkout; Docker uses that manifest because its context excludes `.git`.
  Refresh and commit `app/data/sitemap-dates.json` after future content edits.
- Private offer/setup/checkout routes get `X-Robots-Tag: noindex, nofollow,
  noarchive`, complementing Hub/offer metadata and robots exclusions. These
  directives do not replace authentication or token validation.
- Public files with mutable names use a one-hour, revalidating cache instead
  of a one-year immutable cache. Next's fingerprinted chunks retain its defaults.
- The featured project image is below the homepage hero: remove its eager
  priority preload so it does not compete with first-screen resources/fonts.
- The contact email anchor is enclosed in Cloudflare's documented `email_off`
  comments, preserving a crawlable `mailto:` instead of `/cdn-cgi/l/email-protection`.
  The component emits only trusted fixed markup and permits no dynamic address.

## Findings requiring deployed verification

- **Compression:** `compress: true` was already enabled. A live request on
  6 October with `Accept-Encoding: gzip, br` returned `content-encoding: br`.
  The PDF's missing-compression error did not reproduce. Do not add a redundant
  compression layer based solely on that finding.
- **ETag:** enable Next ETag generation explicitly. Cloudflare HTML rewriting
  can remove validators; check at the origin and edge separately. Never add a
  fabricated fixed ETag or Last-Modified value to dynamic responses.
- **Cloudflare email rewriting:** after deployment, rerun the smoke checker on
  the public domain. If edge HTML still rewrites addresses, disable Email Address
  Obfuscation for the affected paths using a Cloudflare configuration rule.
  Other existing email anchors can also be migrated to the protected component.
- **LCP:** the PDF measured 3.05 seconds; the patch reduces a competing image
  preload, but no new Lighthouse score or LCP improvement is claimed. Remeasure
  on mobile after deployment. Keep Next's generated CSS/hydration loading intact.
- Hreflang is unnecessary while the site has only Swedish public content.

The existing full-repository lint run reports seven errors in CookieConsent,
NotificationCenter, ComposeForm, demo-actions, TemplateEditor and settings/page.
Those files are unchanged by this PR. Lint the changed source files separately
until the existing lint backlog is resolved.

The dependency audit fell from **1 critical + 6 high** to **0 critical + 4 high**.
Remaining findings are in Prisma tooling (`prisma`, `@prisma/config`,
`deepmerge-ts`, `mysql2`), with exact upstream dependency pins. The project uses
PostgreSQL through adapter-pg; that alone does not justify declaring the remaining
findings harmless. Do not force npm's proposed Prisma 7 → 6 downgrade or a
cross-major deepmerge override in this patch. Track an upstream-compatible
Prisma remediation separately and review which tooling reaches the deployment.

## Validation commands

```sh
npm run test:security-seo
npm run typecheck
npm run lint
npm run build
# With next start running on port 3000:
npm run check:security-seo
# After deployment:
SEO_CHECK_URL=https://staarkinc.com npm run check:security-seo
curl -sS -D - -o /dev/null -H 'Accept-Encoding: gzip, br' https://staarkinc.com/
```

Review Hub login, consent acceptance/analytics, contact submission and the SaaS
checkout flow in the browser after deployment. No live payments are needed to
inspect whether the new policy blocks a required browser resource.

References:

- https://nextjs.org/docs/app/guides/content-security-policy
- https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/
- https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j
- https://github.com/nodemailer/nodemailer/security/advisories
