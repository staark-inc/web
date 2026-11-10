import assert from "node:assert/strict";
import {
  after,
  beforeEach,
  test,
} from "node:test";

import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

import {
  disableUser,
  updateUserIdentity,
  updateUserPassword,
} from "@/lib/account-security";
import {
  authenticateLogin,
} from "@/lib/login";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  clearOAuthStateCookie,
  createOAuthState,
  oauthStateCookieOptions,
  validateOAuthState,
} from "@/lib/oauth-state";
import {
  cleanupExpiredRateLimits,
  consumeRateLimit,
} from "@/lib/rate-limit";
import {
  RequestBodyError,
  readBoundedBody,
} from "@/lib/request-body";
import {
  clientIp,
  sameOriginRequest,
} from "@/lib/request-security";
import {
  hashSetupClaimToken,
  consumeSetupClaimToken,
  createSetupClaimForProvisioning,
  inspectSetupClaimToken,
  isStripeCheckoutSessionId,
} from "@/lib/saas/setup-claim";
import {
  SESSION_COOKIE,
  authorizeSessionToken,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/session";
import {
  submitSupportRequest,
} from "@/lib/support-intake";
import { prisma } from "@/lib/prisma";

import { POST as loginPost } from "../app/api/hub/login/route.ts";
import { POST as checkoutPost } from "../app/api/saas/checkout/route.ts";
import { POST as claimPost } from "../app/api/saas/setup/claim-token/route.ts";

const databaseUrl =
  process.env.DATABASE_URL ?? "";

if (
  !/^postgres(ql)?:\/\/[^@]+@(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//.test(
    databaseUrl
  )
) {
  throw new Error(
    "SEC-002 tests require a disposable local PostgreSQL database."
  );
}

let sequence = 0;

function unique(prefix: string) {
  sequence += 1;
  return `${prefix}-${process.pid}-${Date.now()}-${sequence}`;
}

async function createUser(
  overrides: {
    email?: string;
    password?: string;
    disabledAt?: Date | null;
  } = {}
) {
  const email =
    overrides.email ??
    `${unique("user")}@example.com`;

  return prisma.user.create({
    data: {
      name: "Security Test Admin",
      email,
      passwordHash: await bcrypt.hash(
        overrides.password ?? "correct-horse-battery",
        4
      ),
      ...(overrides.disabledAt !== undefined
        ? { disabledAt: overrides.disabledAt }
        : {}),
    },
  });
}

async function truncateSecurityTables() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "RateLimitBucket",
      "SaasSetupClaim",
      "SaasProvisioning",
      "BillingSubscription",
      "BillingCustomer",
      "SupportRequest",
      "Notification",
      "User",
      "Client"
    RESTART IDENTITY CASCADE
  `);
}

function loginRequest(input: {
  email: string;
  password: string;
  ip: string;
}) {
  return new Request(
    "https://staarkinc.com/api/hub/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://staarkinc.com",
        "cf-connecting-ip": input.ip,
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
      }),
    }
  );
}

async function createClaimFixture() {
  const suffix = unique("saas");

  const client = await prisma.client.create({
    data: {
      name: "Security Test Client",
      billingEmail: `${suffix}@example.com`,
    },
  });

  const customer =
    await prisma.billingCustomer.create({
      data: {
        clientId: client.id,
        environment: "TEST",
        stripeCustomerId: `cus_test_${suffix}`,
      },
    });

  const subscription =
    await prisma.billingSubscription.create({
      data: {
        clientId: client.id,
        billingCustomerId: customer.id,
        environment: "TEST",
        stripeSubscriptionId: `sub_test_${suffix}`,
        stripePriceId: "price_test_security",
        planCode: "SAAS",
        interval: "MONTH",
        unitAmountOre: 29900,
        status: "ACTIVE",
        entitlements: {},
      },
    });

  return prisma.saasProvisioning.create({
    data: {
      clientId: client.id,
      billingSubscriptionId: subscription.id,
      environment: "TEST",
      planCode: "SAAS",
      entitlements: {},
      status: "PENDING_SETUP",
    },
  });
}

beforeEach(async () => {
  await truncateSecurityTables();
});

after(async () => {
  await prisma.$disconnect();
});

test("login rejects oversized JSON with 413 and does not accept an unbounded stream", async () => {
  const oversized = new Request(
    "https://staarkinc.com/api/hub/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://staarkinc.com",
        "Content-Length": "1",
      },
      body: JSON.stringify({
        email: "anna@example.com",
        password: "x".repeat(64 * 1024),
      }),
    }
  );

  await assert.rejects(
    readBoundedBody(oversized, 64 * 1024),
    (error) =>
      error instanceof RequestBodyError &&
      error.status === 413
  );

  const response = await loginPost(
    new Request(
      "https://staarkinc.com/api/hub/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://staarkinc.com",
        },
        body: JSON.stringify({
          email: "anna@example.com",
          password: "x".repeat(64 * 1024),
        }),
      }
    )
  );

  assert.equal(response.status, 413);
  assert.equal(
    response.headers.get("cache-control"),
    "no-store"
  );
});

test("login rate-limits repeated account attempts with Retry-After", async () => {
  const email = `${unique("brute")}@example.com`;
  const ip = `203.0.113.${sequence + 10}`;

  const previousTrust =
    process.env.STAARK_TRUST_PROXY_HEADERS;

  process.env.STAARK_TRUST_PROXY_HEADERS = "1";

  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await loginPost(
        loginRequest({
          email,
          password: "wrong-password",
          ip,
        })
      );

      assert.equal(response.status, 401);
    }

    const limited = await loginPost(
      loginRequest({
        email,
        password: "wrong-password",
        ip,
      })
    );

    assert.equal(limited.status, 429);
    assert.ok(
      Number(limited.headers.get("retry-after")) > 0
    );
    assert.equal(
      limited.headers.get("cache-control"),
      "no-store"
    );
  } finally {
    if (previousTrust === undefined) {
      delete process.env.STAARK_TRUST_PROXY_HEADERS;
    } else {
      process.env.STAARK_TRUST_PROXY_HEADERS =
        previousTrust;
    }
  }
});

test("invalid credentials are indistinguishable and successful login keeps the cookie contract", async () => {
  const user = await createUser({
    email: `${unique("valid")}@example.com`,
    password: "valid-password-123",
  });

  const previousTrust =
    process.env.STAARK_TRUST_PROXY_HEADERS;

  process.env.STAARK_TRUST_PROXY_HEADERS = "1";

  try {
    const unknown = await loginPost(
      loginRequest({
        email: `${unique("unknown")}@example.com`,
        password: "wrong-password",
        ip: "203.0.113.40",
      })
    );

    const wrong = await loginPost(
      loginRequest({
        email: user.email,
        password: "wrong-password",
        ip: "203.0.113.41",
      })
    );

    assert.equal(unknown.status, 401);
    assert.equal(wrong.status, 401);
    assert.deepEqual(
      await unknown.json(),
      await wrong.json()
    );

    const success = await loginPost(
      loginRequest({
        email: user.email,
        password: "valid-password-123",
        ip: "203.0.113.42",
      })
    );

    assert.equal(success.status, 200);
    const body = await success.json();
    assert.equal(body.ok, true);

    const token = success.cookies.get(
      SESSION_COOKIE
    )?.value;
    assert.ok(token);

    const cookie = success.headers.get("set-cookie");
    assert.ok(cookie);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=lax/i);
    assert.match(cookie, /Max-Age=604800/i);

    const session = await authorizeSessionToken(token);
    assert.equal(session?.userId, user.id);
    assert.equal(session?.sessionVersion, 0);
  } finally {
    if (previousTrust === undefined) {
      delete process.env.STAARK_TRUST_PROXY_HEADERS;
    } else {
      process.env.STAARK_TRUST_PROXY_HEADERS =
        previousTrust;
    }
  }
});

test("password rotation invalidates old tokens, including legacy tokens", async () => {
  const user = await createUser();
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: "ADMIN",
    sessionVersion: user.sessionVersion,
  });

  assert.ok(await authorizeSessionToken(token));

  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET
  );

  const legacyToken = await new SignJWT({
    email: user.email,
    role: "ADMIN",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);

  const legacyPayload =
    await verifySessionToken(legacyToken);
  assert.equal(legacyPayload?.sessionVersion, null);
  assert.ok(
    await authorizeSessionToken(legacyToken)
  );

  await updateUserPassword(
    user.id,
    await bcrypt.hash("new-password-123", 4)
  );

  assert.equal(
    await authorizeSessionToken(token),
    null
  );
  assert.equal(
    await authorizeSessionToken(legacyToken),
    null
  );

  const refreshed =
    await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { sessionVersion: true },
    });

  const replacement =
    await createSessionToken({
      userId: user.id,
      email: user.email,
      role: "ADMIN",
      sessionVersion: refreshed.sessionVersion,
    });

  assert.ok(
    await authorizeSessionToken(replacement)
  );
});

test("disabled and deleted users lose access immediately", async () => {
  const disabled = await createUser();
  const disabledToken =
    await createSessionToken({
      userId: disabled.id,
      email: disabled.email,
      role: "ADMIN",
      sessionVersion: disabled.sessionVersion,
    });

  assert.ok(
    await authorizeSessionToken(disabledToken)
  );
  await disableUser(disabled.id);
  assert.equal(
    await authorizeSessionToken(disabledToken),
    null
  );

  const deleted = await createUser();
  const deletedToken =
    await createSessionToken({
      userId: deleted.id,
      email: deleted.email,
      role: "ADMIN",
      sessionVersion: deleted.sessionVersion,
    });

  assert.ok(
    await authorizeSessionToken(deletedToken)
  );
  await prisma.user.delete({
    where: { id: deleted.id },
  });
  assert.equal(
    await authorizeSessionToken(deletedToken),
    null
  );
});

test("OAuth state is random, short-lived, single-use and cookie-protected", () => {
  const first = createOAuthState(1000);
  const second = createOAuthState(1000);

  assert.notEqual(first.state, second.state);
  assert.equal(first.expiresAt, 601000);
  assert.equal(
    validateOAuthState(
      first.cookieValue,
      first.state,
      2000
    ),
    "valid"
  );
  assert.equal(
    validateOAuthState(
      undefined,
      first.state,
      2000
    ),
    "missing"
  );
  assert.equal(
    validateOAuthState(
      first.cookieValue,
      "different-state",
      2000
    ),
    "mismatch"
  );
  assert.equal(
    validateOAuthState(
      first.cookieValue,
      first.state,
      601000
    ),
    "expired"
  );

  // A replay arrives after the first callback has cleared the cookie.
  assert.equal(
    validateOAuthState(
      undefined,
      first.state,
      2000
    ),
    "missing"
  );

  const options = oauthStateCookieOptions(true);
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.maxAge, 600);
  assert.equal(options.path, "/api/hub/google");

  const response = NextResponse.json({});
  clearOAuthStateCookie(response, true);
  const setCookie =
    response.headers.get("set-cookie") ?? "";

  assert.match(
    setCookie,
    new RegExp(`${GOOGLE_OAUTH_STATE_COOKIE}=;`)
  );
  assert.match(setCookie, /Max-Age=0/i);
});

test("support intake rejects oversized bodies, ignores spoofed proxy headers and deduplicates", async () => {
  const forwarded = new Request(
    "https://staarkinc.com/api/support",
    {
      method: "POST",
      headers: {
        "cf-connecting-ip": "192.0.2.10",
        "x-forwarded-for": "198.51.100.10",
      },
    }
  );

  assert.equal(clientIp(forwarded, false), null);
  assert.equal(
    clientIp(forwarded, true),
    "192.0.2.10"
  );

  const xffOnly = new Request(
    "https://staarkinc.com/api/support",
    {
      method: "POST",
      headers: {
        "x-forwarded-for": "198.51.100.20",
      },
    }
  );

  assert.equal(clientIp(xffOnly, true), null);

  assert.equal(
    sameOriginRequest(
      new Request(
        "https://staarkinc.com/api/support",
        {
          method: "POST",
          headers: {
            Origin: "https://evil.example",
          },
        }
      )
    ),
    false
  );

  const input = {
    name: "Anna Andersson",
    email: `${unique("support")}@example.com`,
    company: "Test AB",
    website: "https://example.com",
    title: "Hjälp med webbplatsen",
    description:
      "Detta är ett testärende med tillräckligt lång beskrivning.",
    category: "WEBSITE",
    priority: "NORMAL",
  };

  const first = await submitSupportRequest(input, {
    ip: "203.0.113.50",
  });

  assert.equal(first.kind, "success");
  assert.equal(first.created, true);

  const second = await submitSupportRequest(input, {
    ip: "203.0.113.50",
  });

  assert.equal(second.kind, "success");
  assert.equal(second.created, false);
  assert.equal(second.reference, first.reference);

  const count =
    await prisma.supportRequest.count({
      where: {
        requesterEmail: input.email,
      },
    });

  assert.equal(count, 1);

  const oversized = new Request(
    "https://staarkinc.com/api/support",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...input,
        description: "x".repeat(64 * 1024),
      }),
    }
  );

  await assert.rejects(
    readBoundedBody(oversized, 64 * 1024),
    (error) =>
      error instanceof RequestBodyError &&
      error.status === 413
  );
});

test("support limits per IP and per email with trusted client identity", async () => {
  const base = {
    name: "Rate Limit Tester",
    company: "",
    website: "",
    category: "OTHER",
    priority: "NORMAL",
  };

  for (let index = 0; index < 5; index++) {
    const result = await submitSupportRequest(
      {
        ...base,
        email: `${unique("ip-limit")}@example.com`,
        title: `IP limit ${index}`,
        description: `IP limit test ${index} with enough detail.`,
      },
      {
        ip: "203.0.113.60",
      }
    );

    assert.equal(result.kind, "success");
  }

  const ipLimited = await submitSupportRequest(
    {
      ...base,
      email: `${unique("ip-limited")}@example.com`,
      title: "IP limit blocked",
      description:
        "This request should be blocked by the per-IP ceiling.",
    },
    {
      ip: "203.0.113.60",
    }
  );

  assert.equal(ipLimited.kind, "rate_limited");

  const sharedEmail = `${unique(
    "email-limit"
  )}@example.com`;

  for (let index = 0; index < 3; index++) {
    const result = await submitSupportRequest(
      {
        ...base,
        email: sharedEmail,
        title: `Email limit ${index}`,
        description: `Email limit test ${index} with enough detail.`,
      },
      {
        ip: `203.0.113.${70 + index}`,
      }
    );

    assert.equal(result.kind, "success");
  }

  const emailLimited = await submitSupportRequest(
    {
      ...base,
      email: sharedEmail,
      title: "Email limit blocked",
      description:
        "This request should be blocked by the per-email ceiling.",
    },
    {
      ip: "203.0.113.80",
    }
  );

  assert.equal(emailLimited.kind, "rate_limited");
});

test("rate limits are atomic across concurrent callers and expired buckets are cleaned", async () => {
  const key = unique("limit");

  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      consumeRateLimit({
        key,
        limit: 5,
        windowMs: 60 * 1000,
      })
    )
  );

  assert.equal(
    results.filter((result) => result.allowed)
      .length,
    5
  );

  const expiredKey = unique("expired");
  await prisma.rateLimitBucket.create({
    data: {
      key: expiredKey,
      count: 1,
      resetAt: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ),
    },
  });

  await cleanupExpiredRateLimits();

  assert.equal(
    await prisma.rateLimitBucket.findUnique({
      where: { key: expiredKey },
    }),
    null
  );
});

test("setup claims are one-time, expire, and repeat claims do not revoke valid links", async () => {
  assert.equal(
    isStripeCheckoutSessionId(
      "cs_test_abc1234567890"
    ),
    true
  );
  assert.equal(
    isStripeCheckoutSessionId(
      "cs_live_abc1234567890"
    ),
    true
  );
  assert.equal(
    isStripeCheckoutSessionId("cs_test_"),
    false
  );
  assert.equal(
    isStripeCheckoutSessionId("not-a-session"),
    false
  );

  const provisioning =
    await createClaimFixture();

  const first =
    await createSetupClaimForProvisioning(
      provisioning.id
    );

  const second =
    await createSetupClaimForProvisioning(
      provisioning.id
    );

  assert.notEqual(first.token, second.token);

  const firstClaim =
    await prisma.saasSetupClaim.findUniqueOrThrow({
      where: {
        tokenHash: hashSetupClaimToken(
          first.token
        ),
      },
      select: {
        revokedAt: true,
      },
    });

  assert.equal(firstClaim.revokedAt, null);

  const consumed =
    await consumeSetupClaimToken(first.token);

  assert.equal(consumed.status, "CLAIMED");

  await assert.rejects(
    consumeSetupClaimToken(first.token),
    /already been used/
  );

  const expiring =
    await createSetupClaimForProvisioning(
      provisioning.id
    );

  await prisma.saasSetupClaim.update({
    where: {
      tokenHash: hashSetupClaimToken(
        expiring.token
      ),
    },
    data: {
      expiresAt: new Date(Date.now() - 1000),
    },
  });

  await assert.rejects(
    inspectSetupClaimToken(expiring.token),
    /expired/
  );
});

test("checkout and setup-claim endpoints reject cross-origin, oversized and rate-limited requests", async () => {
  const crossOriginCheckout = new Request(
    "https://staarkinc.com/api/saas/checkout",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil.example",
      },
      body: "{}",
    }
  );

  assert.equal(
    (await checkoutPost(crossOriginCheckout)).status,
    403
  );

  const crossOriginClaim = new Request(
    "https://staarkinc.com/api/saas/setup/claim-token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil.example",
      },
      body: "{}",
    }
  );

  assert.equal(
    (await claimPost(crossOriginClaim)).status,
    403
  );

  const oversizedCheckout = new Request(
    "https://staarkinc.com/api/saas/checkout",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://staarkinc.com",
      },
      body: JSON.stringify({
        planCode: "SAAS",
        interval: "month",
        padding: "x".repeat(16 * 1024),
      }),
    }
  );

  assert.equal(
    (await checkoutPost(oversizedCheckout)).status,
    413
  );

  const invalidClaim = new Request(
    "https://staarkinc.com/api/saas/setup/claim-token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://staarkinc.com",
      },
      body: JSON.stringify({
        sessionId: "cs_test_",
      }),
    }
  );

  assert.equal(
    (await claimPost(invalidClaim)).status,
    400
  );

  await prisma.rateLimitBucket.upsert({
    where: {
      key: "saas:checkout:global",
    },
    update: {
      count: 101,
      resetAt: new Date(Date.now() + 60_000),
    },
    create: {
      key: "saas:checkout:global",
      count: 101,
      resetAt: new Date(Date.now() + 60_000),
    },
  });

  const limitedCheckout = await checkoutPost(
    new Request(
      "https://staarkinc.com/api/saas/checkout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://staarkinc.com",
        },
        body: JSON.stringify({
          planCode: "SAAS",
          interval: "month",
        }),
      }
    )
  );

  assert.equal(limitedCheckout.status, 429);
  assert.ok(
    Number(
      limitedCheckout.headers.get("retry-after")
    ) > 0
  );

  await prisma.rateLimitBucket.upsert({
    where: {
      key: "saas:claim:global",
    },
    update: {
      count: 101,
      resetAt: new Date(Date.now() + 60_000),
    },
    create: {
      key: "saas:claim:global",
      count: 101,
      resetAt: new Date(Date.now() + 60_000),
    },
  });

  const limitedClaim = await claimPost(
    new Request(
      "https://staarkinc.com/api/saas/setup/claim-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://staarkinc.com",
        },
        body: JSON.stringify({
          sessionId: "cs_test_abc1234567890",
        }),
      }
    )
  );

  assert.equal(limitedClaim.status, 429);
  assert.ok(
    Number(
      limitedClaim.headers.get("retry-after")
    ) > 0
  );
});

test("identity rotation invalidates old tokens and name-only updates do not", async () => {
  const user = await createUser();
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: "ADMIN",
    sessionVersion: user.sessionVersion,
  });

  const nameOnly = await updateUserIdentity(
    user.id,
    {
      name: "Renamed Admin",
      email: user.email,
    },
    {
      invalidateSessions: false,
    }
  );

  assert.equal(nameOnly.sessionVersion, 0);
  assert.ok(await authorizeSessionToken(token));

  const newEmail = `${unique("rotated")}@example.com`;
  const rotated = await updateUserIdentity(
    user.id,
    {
      name: "Renamed Admin",
      email: newEmail,
    },
    {
      invalidateSessions: true,
    }
  );

  assert.equal(rotated.sessionVersion, 1);
  assert.equal(
    await authorizeSessionToken(token),
    null
  );

  const replacement = await createSessionToken({
    userId: user.id,
    email: newEmail,
    role: "ADMIN",
    sessionVersion: rotated.sessionVersion,
  });

  assert.ok(
    await authorizeSessionToken(replacement)
  );
});

test("login service returns the same generic result for unknown and wrong-password accounts", async () => {
  const user = await createUser({
    password: "right-password-123",
  });

  const unknown = await authenticateLogin({
    email: `${unique("missing")}@example.com`,
    password: "wrong-password",
    ip: null,
  });

  const wrong = await authenticateLogin({
    email: user.email,
    password: "wrong-password",
    ip: null,
  });

  assert.deepEqual(unknown, { kind: "invalid" });
  assert.deepEqual(wrong, { kind: "invalid" });

  assert.deepEqual(
    sessionCookieOptions(true),
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    }
  );
});
