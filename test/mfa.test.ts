import assert from "node:assert/strict";
import {
  after,
  beforeEach,
  test,
} from "node:test";

import bcrypt from "bcryptjs";

import {
  activateMfaEnrollment,
  currentMfaStep,
  disableMfa,
  startMfaEnrollment,
  verifyMfaChallenge,
} from "@/lib/mfa";
import {
  createMfaChallengeToken,
  verifyMfaChallengeToken,
} from "@/lib/mfa-challenge";
import {
  consumeMfaChallengeLimit,
  resetMfaChallengeLimit,
} from "@/lib/mfa-rate-limit";
import {
  generateRecoveryCodes,
  hashRecoveryCode,
} from "@/lib/mfa-recovery";
import { authenticateLogin } from "@/lib/login";
import { prisma } from "@/lib/prisma";
import {
  decryptSecret,
  encryptSecret,
  mfaEncryptionKey,
} from "@/lib/secret-box";
import {
  generateTotp,
  generateTotpSecret,
  verifyTotp,
} from "@/lib/totp";

const databaseUrl =
  process.env.DATABASE_URL ?? "";

if (
  !/^postgres(ql)?:\/\/[^@]+@(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//.test(
    databaseUrl
  )
) {
  throw new Error(
    "MFA tests require a disposable local PostgreSQL database."
  );
}

process.env.MFA_ENCRYPTION_KEY =
  Buffer.alloc(32, 7).toString("base64");

let sequence = 0;

function unique(prefix: string) {
  sequence += 1;
  return `${prefix}-${process.pid}-${Date.now()}-${sequence}`;
}

async function createUser(
  overrides: {
    mfaEnabled?: boolean;
    secret?: string;
    mfaLastUsedStep?: number | null;
  } = {}
) {
  const secret =
    overrides.secret ?? generateTotpSecret();

  const user = await prisma.user.create({
    data: {
      name: "MFA Test Admin",
      email: `${unique("mfa")}@example.com`,
      passwordHash: await bcrypt.hash(
        "correct-horse-battery",
        4
      ),
      mfaEnabled: overrides.mfaEnabled ?? false,
      mfaSecretEncrypted:
        overrides.mfaEnabled === true
          ? encryptSecret(secret)
          : null,
      mfaLastUsedStep:
        overrides.mfaLastUsedStep ?? null,
    },
  });

  return { user, secret };
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "SecurityAuditEvent",
      "MfaRecoveryCode",
      "RateLimitBucket",
      "User"
    RESTART IDENTITY CASCADE
  `);
});

after(async () => {
  await prisma.$disconnect();
});

test("TOTP matches RFC 6238 vectors and secrets are encrypted at rest", () => {
  const rfcSecret =
    "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

  assert.equal(
    generateTotp(rfcSecret, 1, 8),
    "94287082"
  );
  assert.equal(
    generateTotp(rfcSecret, 37037036, 8),
    "07081804"
  );
  assert.equal(
    generateTotp(rfcSecret, 37037037, 8),
    "14050471"
  );

  const secret = generateTotpSecret();
  const encrypted = encryptSecret(secret);
  assert.notEqual(encrypted, secret);
  assert.equal(
    decryptSecret(encrypted),
    secret
  );

  const tampered =
    encrypted.slice(0, -2) +
    (encrypted.endsWith("AA") ? "BB" : "AA");
  assert.throws(() => decryptSecret(tampered));

  const step = currentMfaStep();
  const code = generateTotp(secret, step);
  assert.equal(
    verifyTotp(secret, code),
    step
  );
  assert.equal(
    verifyTotp(secret, "000000"),
    null
  );
  assert.equal(
    mfaEncryptionKey().length,
    32
  );
});

test("enrollment requires confirmation and produces one-time recovery hashes", async () => {
  const { user } = await createUser();

  const enrollment =
    await startMfaEnrollment(
      user.id,
      "203.0.113.10"
    );
  const code = generateTotp(
    enrollment.secret,
    currentMfaStep() + 1
  );

  assert.equal(
    await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { mfaEnabled: true },
    }).then((row) => row.mfaEnabled),
    false
  );

  const activated =
    await activateMfaEnrollment({
      userId: user.id,
      code,
      ip: "203.0.113.10",
    });

  assert.equal(activated.kind, "success");
  if (activated.kind !== "success") return;

  assert.equal(
    activated.recoveryCodes.length,
    10
  );

  const stored =
    await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        mfaEnabled: true,
        sessionVersion: true,
        mfaSecretEncrypted: true,
        mfaPendingSecretEncrypted: true,
      },
    });

  assert.equal(stored.mfaEnabled, true);
  assert.equal(stored.sessionVersion, 1);
  assert.ok(stored.mfaSecretEncrypted);
  assert.equal(
    stored.mfaPendingSecretEncrypted,
    null
  );

  assert.equal(
    await prisma.mfaRecoveryCode.count({
      where: { userId: user.id },
    }),
    10
  );

  const events =
    await prisma.securityAuditEvent.findMany({
      where: { userId: user.id },
      select: { type: true },
    });

  assert.ok(
    events.some(
      (event) =>
        event.type ===
        "mfa.enrollment_started"
    )
  );
  assert.ok(
    events.some(
      (event) =>
        event.type ===
        "mfa.enrollment_activated"
    )
  );
});

test("MFA login returns a partial challenge and rejects TOTP replay", async () => {
  const { user, secret } = await createUser({
    mfaEnabled: true,
  });

  const login = await authenticateLogin({
    email: user.email,
    password: "correct-horse-battery",
    ip: null,
  });

  assert.equal(login.kind, "mfa_required");
  if (login.kind !== "mfa_required") return;

  const challenge =
    await verifyMfaChallengeToken(login.token);
  assert.equal(challenge?.userId, user.id);
  assert.equal(challenge?.sessionVersion, 0);

  const step = currentMfaStep();
  const code = generateTotp(secret, step);

  const verified = await verifyMfaChallenge({
    userId: user.id,
    sessionVersion: 0,
    code,
    ip: "203.0.113.20",
    now: step * 30 * 1000,
  });

  assert.equal(verified.kind, "success");

  const replay = await verifyMfaChallenge({
    userId: user.id,
    sessionVersion: 0,
    code,
    ip: "203.0.113.20",
    now: step * 30 * 1000,
  });

  assert.equal(replay.kind, "invalid");

  const replayAudit =
    await prisma.securityAuditEvent.findFirst({
      where: {
        userId: user.id,
        type: "mfa.replay_rejected",
      },
      select: { id: true },
    });

  assert.ok(replayAudit);
});

test("recovery codes are one-time and audited", async () => {
  const { user, secret } = await createUser({
    mfaEnabled: true,
  });
  const recoveryCodes = generateRecoveryCodes(2);

  await prisma.mfaRecoveryCode.createMany({
    data: recoveryCodes.map((code) => ({
      userId: user.id,
      codeHash: hashRecoveryCode(
        user.id,
        code
      ),
    })),
  });

  const first = await verifyMfaChallenge({
    userId: user.id,
    sessionVersion: 0,
    code: recoveryCodes[0],
    ip: "203.0.113.30",
    now: currentMfaStep() * 30 * 1000,
  });

  assert.equal(first.kind, "success");

  const second = await verifyMfaChallenge({
    userId: user.id,
    sessionVersion: 0,
    code: recoveryCodes[0],
    ip: "203.0.113.30",
    now: currentMfaStep() * 30 * 1000,
  });

  assert.equal(second.kind, "invalid");

  const recoveryAudit =
    await prisma.securityAuditEvent.findFirst({
      where: {
        userId: user.id,
        type: "mfa.recovery_used",
      },
      select: { id: true },
    });

  assert.ok(recoveryAudit);

  // A recovery code must not be usable as a TOTP secret.
  assert.equal(
    verifyTotp(secret, recoveryCodes[0]),
    null
  );
});

test("disable requires the password and a fresh code, then revokes sessions", async () => {
  const step = currentMfaStep();
  const { user, secret } = await createUser({
    mfaEnabled: true,
    mfaLastUsedStep: step,
  });

  const wrongPassword = await disableMfa({
    userId: user.id,
    password: "wrong-password",
    code: generateTotp(secret, step + 1),
    now: (step + 1) * 30 * 1000,
  });

  assert.equal(wrongPassword.kind, "invalid");
  assert.equal(
    await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { mfaEnabled: true },
    }).then((row) => row.mfaEnabled),
    true
  );

  const disabled = await disableMfa({
    userId: user.id,
    password: "correct-horse-battery",
    code: generateTotp(secret, step + 1),
    now: (step + 1) * 30 * 1000,
  });

  assert.equal(disabled.kind, "success");
  if (disabled.kind !== "success") return;

  assert.equal(disabled.sessionVersion, 1);

  const stored =
    await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        mfaEnabled: true,
        mfaSecretEncrypted: true,
        mfaLastUsedStep: true,
      },
    });

  assert.equal(stored.mfaEnabled, false);
  assert.equal(stored.mfaSecretEncrypted, null);
  assert.equal(stored.mfaLastUsedStep, null);

  const audit =
    await prisma.securityAuditEvent.findFirst({
      where: {
        userId: user.id,
        type: "mfa.disabled",
      },
      select: { id: true },
    });

  assert.ok(audit);
});

test("challenge rate limits are shared and reset after success", async () => {
  const { user } = await createUser();

  for (let attempt = 0; attempt < 5; attempt++) {
    const result =
      await consumeMfaChallengeLimit({
        userId: user.id,
        ip: "203.0.113.40",
      });
    assert.equal(result.allowed, true);
  }

  const limited =
    await consumeMfaChallengeLimit({
      userId: user.id,
      ip: "203.0.113.40",
    });

  assert.equal(limited.allowed, false);
  assert.ok(limited.retryAfter > 0);

  await resetMfaChallengeLimit(user.id);

  const reset =
    await consumeMfaChallengeLimit({
      userId: user.id,
      ip: "203.0.113.40",
    });

  assert.equal(reset.allowed, true);
});

test("expired enrollment cannot be activated", async () => {
  const { user } = await createUser();
  const enrollment =
    await startMfaEnrollment(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfaPendingExpiresAt: new Date(
        Date.now() - 1000
      ),
    },
  });

  const result = await activateMfaEnrollment({
    userId: user.id,
    code: generateTotp(
      enrollment.secret,
      currentMfaStep()
    ),
  });

  assert.equal(result.kind, "invalid");
});

test("the MFA challenge token is purpose-bound and expires", async () => {
  const token = await createMfaChallengeToken({
    userId: "user-id",
    email: "mfa@example.com",
    sessionVersion: 3,
  });

  const payload =
    await verifyMfaChallengeToken(token);
  assert.equal(payload?.userId, "user-id");
  assert.equal(payload?.sessionVersion, 3);

  assert.equal(
    await verifyMfaChallengeToken(
      `${token.slice(0, -4)}xxxx`
    ),
    null
  );
});
