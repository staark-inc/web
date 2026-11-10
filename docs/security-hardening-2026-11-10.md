# SEC-002 authentication and public API hardening

Date: 2026-11-10

Target: `dev`

Related audit: STAARK-WEB-AUDIT-001

## What changed

- Hub login now enforces a 64 KiB body ceiling, same-origin requests, generic
  failure responses, a dummy bcrypt comparison for unknown accounts, and
  per-IP/per-account/global rate limits.
- Sessions carry a `sessionVersion`. `getSession()` re-checks the user row on
  every privileged request, so a password change, identity change, account
  disable or account deletion invalidates existing cookies.
- Google Analytics/Search Console OAuth uses a random, short-lived, single-use
  state cookie. State is validated before any token exchange.
- Public support intake now uses bounded parsing, same-origin checks,
  trusted-proxy IP handling, database-backed rate limits, input length
  rejection, and duplicate suppression.
- The existing contact intake now uses the same shared PostgreSQL limiter,
  replacing the per-process map for production enforcement.
- SaaS checkout and setup-claim requests are origin-checked, size-bounded and
  rate-limited. Setup-claim retries no longer revoke links that are still
  valid; the public endpoint caps active links at 10.
- Checkout responses no longer return the full Stripe Checkout Session id to
  the browser, and the success page masks it.

## Database migration

`prisma/migrations/20261110120000_auth_session_hardening/migration.sql`

- Adds `User.sessionVersion` with default `0`.
- Adds nullable `User.disabledAt`.
- Creates the shared `RateLimitBucket` table and its `resetAt` index.

The migration is additive. It does not enumerate, drop or modify any existing
table. In particular, the production-only `BillingWebhookEvent` and
`SaasPaymentFailureState` tables remain untouched even though they are not
represented in `prisma/schema.prisma`.

Apply with the normal reviewed migration process:

```bash
npx prisma migrate deploy
```

Do not use `prisma migrate dev` against production; the schema intentionally
does not model all production tables.

## Session rollout

Existing JWTs do not carry `sv`. They are accepted only while the account is
still at `sessionVersion = 0`. Any password/identity rotation or account
disable increments the version and invalidates those legacy cookies
immediately. Newly issued tokens always carry the version. Existing sessions
therefore expire naturally at the seven-day JWT lifetime if no security event
occurs.

`disabledAt` is the operational disable switch. There is no new UI for it; an
operator can disable an account with:

```sql
UPDATE "User"
SET "disabledAt" = NOW(),
    "sessionVersion" = "sessionVersion" + 1
WHERE "id" = '<user-id>';
```

## Deployment configuration

Set `STAARK_TRUST_PROXY_HEADERS=1` only when the application is behind a proxy
(for example Cloudflare) that overwrites `CF-Connecting-IP`/`X-Real-IP` and
blocks direct origin access. Without that flag, per-IP buckets are skipped;
global, account and email ceilings still apply. The legacy
`CONTACT_TRUST_PROXY_HEADERS=1` flag is also accepted for compatibility.

Set `SAAS_PUBLIC_ORIGIN` to the canonical public origin. Without it, checkout
return URLs use the request origin unless a trusted proxy is explicitly
enabled.

## Rate-limit policy

| Surface | Scope | Limit |
|---|---|---|
| Hub login | global | 300 / 5 min |
| Hub login | IP | 10 / 15 min |
| Hub login | account | 5 / 15 min |
| Support | global | 60 / 1 min |
| Support | IP | 5 / 10 min |
| Support | email | 3 / 10 min |
| Contact | global | 60 / 1 min |
| Contact | IP | 5 / 10 min |
| Contact | email | 3 / 10 min |
| Checkout | global | 100 / hour |
| Checkout | IP | 10 / hour |
| Setup claim | global | 100 / 10 min |
| Setup claim | IP | 10 / 10 min |
| Setup claim | session id | 5 / 10 min |
| Setup complete | global | 100 / hour |
| Setup complete | IP | 20 / hour |

Buckets live in PostgreSQL and are updated with one atomic
`INSERT ... ON CONFLICT` statement, so limits hold across multiple application
instances. Expired buckets are removed opportunistically.

## Deployment order

1. Apply the migration with the reviewed production process.
2. Confirm `User.sessionVersion`/`disabledAt` and `RateLimitBucket` exist.
3. Set `STAARK_TRUST_PROXY_HEADERS=1` only behind the trusted proxy, and set
   `SAAS_PUBLIC_ORIGIN` if checkout runs behind a proxy.
4. Deploy the application image.
5. Run the staging smoke test below.

## Verification

The SEC-002 suite is `npm run test:security-hardening`. It requires a
disposable local PostgreSQL database, refuses non-local URLs, and applies all
migrations before running. CI starts PostgreSQL 17 and runs the suite before
the existing browser/security checks.

## Residual risks

- A distributed attacker can still rotate source addresses; the global and
  account ceilings bound the total attempt rate but cannot prevent all
  credential stuffing.
- Login rate limits are temporary, not permanent account lockouts.
- OAuth callback integration with Google is not exercised against the live
  provider in CI; state validation and cookie clearing are unit-tested, and
  the connection flow should be smoke-tested on staging.
- Support notification delivery is best-effort after the ticket is stored.
- `nodemailer` and the remaining dependency advisories are outside this PR.

## Staging smoke test

1. Failed Hub login five times; confirm 429 with `Retry-After`, then confirm
   the account recovers after the window.
2. Sign in, change the password, and confirm the old cookie no longer opens
   another browser.
3. Connect Google Analytics; confirm the callback succeeds and a replayed
   callback is rejected without a token exchange.
4. Submit the public support form twice with the same data; confirm one ticket
   and the same reference.
5. Start a test checkout; confirm the success page shows only a masked
   reference and that clicking "configure" twice leaves the first setup link
   usable.
6. Exercise a normal Hub page and a Server Action form.

## Rollback

Revert the PR and redeploy the previous image. The migration is additive, so
the old application can run against the new schema. Dropping the added columns
or `RateLimitBucket` is not required for rollback and should follow the normal
reviewed cleanup process.
