# SEC-002.10 Server-only database access audit

Date: 2026-11-10

Target: `dev`

## Threat model

- A Client Component imports Prisma/PostgreSQL code and ships server logic or
  credentials to the browser.
- A new Hub API route or Server Action forgets authorization.
- A route returns a full database record containing tokens, secrets or
  unnecessary personal data.
- A raw SQL query interpolates user input.
- A public token endpoint is accidentally treated as a privileged route, or a
  privileged endpoint as public.

## Inventory and changes

### Database entrypoint

- `lib/prisma.ts` now imports `lib/server-only.ts`.
- `lib/server-only.ts` throws if evaluated in a browser, as a runtime backstop.
- Client Components must use type-only imports or
  `generated/prisma/browser.ts` / `generated/prisma/enums.ts`.

### Authorization coverage

- Every `app/api/hub/**/route.ts` must call `getSession()` unless explicitly
  allowlisted:
  - `login` / `logout` — credential/session lifecycle.
  - `integrations/stripe/webhook` — Stripe signature verification.
  - `wordpress/connect` — one-time pairing code.
  - `wordpress/ping`, `wordpress/sync`, `wordpress/releases` — HMAC-signed
    connector requests.
- Every Hub Server Action file must call `getSession()`.
- The public offer Server Action (`app/offert/[token]/actions.ts`) is
  allowlisted because authorization is the unguessable offer token, not a Hub
  session.

The application currently has a single `ADMIN` role and a single-tenant Hub.
All authenticated admins can operate on all CRM records by design. There is no
per-user record ownership layer to preserve. If additional roles are added,
this checker must be extended with explicit scope rules.

### Minimal DTOs and errors

- Analytics test response no longer returns `GA4_PROPERTY_ID`.
- Search Console test response no longer returns `SEARCH_CONSOLE_SITE_URL`.
- Analytics, Search Console and Stripe connection-test failures now return
  generic client messages; full details stay in server logs.
- Stripe account test still returns the minimal account display fields needed
  by the existing UI (id/name/email/country/currency/mode).
- Settings pages continue to map refresh-token booleans rather than returning
  the token values.

### SQL

- No `$queryRawUnsafe` or `$executeRawUnsafe` calls exist in `app/` or `lib/`.
- Existing `$queryRaw` / `$executeRaw` calls are tagged templates and remain
  parameterized.
- The checker fails on any future unsafe call.

## Static checks

`scripts/check-server-boundary.mjs`:

1. Parses the real TypeScript import graph.
2. Starts from every `"use client"` file.
3. Follows value imports through local modules.
4. Fails if the graph reaches `lib/prisma.ts`, `lib/server-only.ts`, generated
   Prisma server modules, `pg`, `@prisma/client` or `@prisma/adapter-pg`.
5. Ignores type-only imports, which are erased and browser-safe.
6. Verifies Hub API/Server Action authorization coverage.
7. Rejects unsafe raw SQL.

`test/server-boundary.test.ts` runs the checker on the repository and on a
synthetic violating fixture.

## Compatibility risks

- A legitimate client import of a Prisma enum from
  `@/generated/prisma/client` is now flagged as a value import. Use
  `@/generated/prisma/browser` or import types only.
- New Hub API routes or Server Actions must use `getSession()` or be added to
  the explicit allowlist with a documented non-session authorization method.
- The checker is static; it cannot prove row-level ownership semantics. The
  current design has no per-user ownership.

## Verification

- `npm run check:server-boundary`
- `npm run test:server-boundary`
- `npm run typecheck`
- `npm run lint`
- Existing security, public, Google Ads, Hub browser, control-protocol and SaaS
  reconciliation suites.
- Staging: sign in as an admin, load each Hub workspace and exercise one Server
  Action; confirm unauthenticated calls to representative Hub APIs return 401.

## Deployment and rollback

No database migration or runtime configuration is required. Deploy the code,
then run the staging checks. Roll back by reverting the PR. The server-only
guard and static checker have no data side effects.
