import type { Prisma } from "@/generated/prisma/client";
import { verifyPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  isRecoveryCodeShaped,
} from "@/lib/mfa-recovery";
import {
  decryptSecret,
  encryptSecret,
  mfaEncryptionConfigured,
} from "@/lib/secret-box";
import { recordSecurityAudit } from "@/lib/security-audit";
import {
  generateTotpSecret,
  totpStep,
  totpUri,
  verifyTotp,
} from "@/lib/totp";

const MFA_ISSUER = "Staark Hub";
const ENROLLMENT_TTL_MS = 10 * 60 * 1000;

export class MfaConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MfaConfigurationError";
  }
}

export type MfaSuccess = {
  kind: "success";
  userId: string;
  email: string;
  sessionVersion: number;
};

export type MfaInvalid = {
  kind: "invalid";
};

export type MfaResult = MfaSuccess | MfaInvalid;

function assertConfigured() {
  if (!mfaEncryptionConfigured()) {
    throw new MfaConfigurationError(
      "MFA encryption is not configured."
    );
  }
}

async function lockUser(
  tx: Prisma.TransactionClient,
  userId: string
) {
  await tx.$queryRaw<Array<{ acquired: number }>>`
    SELECT 1::int AS acquired
    FROM pg_advisory_xact_lock(
      hashtextextended(${`mfa:${userId}`}, 0)
    )
  `;
}

function isFreshStep(
  lastUsedStep: number | null,
  step: number
) {
  return (
    lastUsedStep === null ||
    step > lastUsedStep
  );
}

export async function startMfaEnrollment(
  userId: string,
  ip?: string | null
) {
  assertConfigured();

  const secret = generateTotpSecret();

  const result = await prisma.$transaction(
    async (tx) => {
      await lockUser(tx, userId);

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          mfaEnabled: true,
          disabledAt: true,
        },
      });

      if (!user || user.disabledAt) {
        throw new Error("Account is not available.");
      }

      if (user.mfaEnabled) {
        throw new Error(
          "Two-factor authentication is already enabled."
        );
      }

      const expiresAt = new Date(
        Date.now() + ENROLLMENT_TTL_MS
      );

      await tx.user.update({
        where: { id: userId },
        data: {
          mfaPendingSecretEncrypted:
            encryptSecret(secret),
          mfaPendingExpiresAt: expiresAt,
        },
      });

      await recordSecurityAudit(tx, {
        userId,
        type: "mfa.enrollment_started",
        ip,
      });

      return { user, expiresAt };
    }
  );

  return {
    secret,
    otpauthUrl: totpUri({
      issuer: MFA_ISSUER,
      account: result.user.email,
      secret,
    }),
    expiresAt: result.expiresAt,
  };
}

export async function activateMfaEnrollment(input: {
  userId: string;
  code: string;
  ip?: string | null;
}): Promise<
  | (MfaSuccess & {
      recoveryCodes: string[];
    })
  | MfaInvalid
> {
  assertConfigured();

  return prisma.$transaction(async (tx) => {
    await lockUser(tx, input.userId);

    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        email: true,
        mfaEnabled: true,
        mfaPendingSecretEncrypted: true,
        mfaPendingExpiresAt: true,
        sessionVersion: true,
        disabledAt: true,
      },
    });

    if (
      !user ||
      user.disabledAt ||
      user.mfaEnabled ||
      !user.mfaPendingSecretEncrypted ||
      !user.mfaPendingExpiresAt ||
      user.mfaPendingExpiresAt.getTime() <= Date.now()
    ) {
      return { kind: "invalid" as const };
    }

    let secret: string;

    try {
      secret = decryptSecret(
        user.mfaPendingSecretEncrypted
      );
    } catch {
      throw new MfaConfigurationError(
        "MFA encryption is not configured."
      );
    }

    const step = verifyTotp(secret, input.code);

    if (step === null) {
      await recordSecurityAudit(tx, {
        userId: user.id,
        type: "mfa.enrollment_failed",
        ip: input.ip,
      });

      return { kind: "invalid" as const };
    }

    const recoveryCodes =
      generateRecoveryCodes();

    await tx.mfaRecoveryCode.deleteMany({
      where: { userId: user.id },
    });

    await tx.mfaRecoveryCode.createMany({
      data: recoveryCodes.map((code) => ({
        userId: user.id,
        codeHash: hashRecoveryCode(
          user.id,
          code
        ),
      })),
    });

    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
        mfaSecretEncrypted:
          user.mfaPendingSecretEncrypted,
        mfaPendingSecretEncrypted: null,
        mfaPendingExpiresAt: null,
        mfaLastUsedStep: step,
        sessionVersion: {
          increment: 1,
        },
      },
      select: {
        id: true,
        email: true,
        sessionVersion: true,
      },
    });

    await recordSecurityAudit(tx, {
      userId: user.id,
      type: "mfa.enrollment_activated",
      ip: input.ip,
    });

    return {
      kind: "success" as const,
      userId: updated.id,
      email: updated.email,
      sessionVersion: updated.sessionVersion,
      recoveryCodes,
    };
  });
}

export async function verifyMfaChallenge(input: {
  userId: string;
  sessionVersion: number;
  code: string;
  ip?: string | null;
  now?: number;
}): Promise<MfaResult> {
  assertConfigured();

  return prisma.$transaction(async (tx) => {
    await lockUser(tx, input.userId);

    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        email: true,
        mfaEnabled: true,
        mfaSecretEncrypted: true,
        mfaLastUsedStep: true,
        sessionVersion: true,
        disabledAt: true,
      },
    });

    if (
      !user ||
      user.disabledAt ||
      !user.mfaEnabled ||
      user.sessionVersion !==
        input.sessionVersion
    ) {
      return { kind: "invalid" as const };
    }

    if (isRecoveryCodeShaped(input.code)) {
      const codeHash = hashRecoveryCode(
        user.id,
        input.code
      );

      const consumed =
        await tx.mfaRecoveryCode.updateMany({
          where: {
            userId: user.id,
            codeHash,
            usedAt: null,
          },
          data: {
            usedAt: new Date(),
          },
        });

      if (consumed.count !== 1) {
        await recordSecurityAudit(tx, {
          userId: user.id,
          type: "mfa.verification_failed",
          ip: input.ip,
          metadata: {
            method: "recovery",
          },
        });

        return { kind: "invalid" as const };
      }

      await recordSecurityAudit(tx, {
        userId: user.id,
        type: "mfa.recovery_used",
        ip: input.ip,
      });

      return {
        kind: "success" as const,
        userId: user.id,
        email: user.email,
        sessionVersion: user.sessionVersion,
      };
    }

    if (!user.mfaSecretEncrypted) {
      return { kind: "invalid" as const };
    }

    let secret: string;

    try {
      secret = decryptSecret(
        user.mfaSecretEncrypted
      );
    } catch {
      throw new MfaConfigurationError(
        "MFA encryption is not configured."
      );
    }

    const step = verifyTotp(
      secret,
      input.code,
      {
        now: input.now,
      }
    );

    if (step === null) {
      await recordSecurityAudit(tx, {
        userId: user.id,
        type: "mfa.verification_failed",
        ip: input.ip,
        metadata: {
          method: "totp",
        },
      });

      return { kind: "invalid" as const };
    }

    if (
      !isFreshStep(user.mfaLastUsedStep, step)
    ) {
      await recordSecurityAudit(tx, {
        userId: user.id,
        type: "mfa.replay_rejected",
        ip: input.ip,
        metadata: {
          step,
        },
      });

      return { kind: "invalid" as const };
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        mfaLastUsedStep: step,
      },
    });

    await recordSecurityAudit(tx, {
      userId: user.id,
      type: "mfa.verification_succeeded",
      ip: input.ip,
      metadata: {
        method: "totp",
        step,
      },
    });

    return {
      kind: "success" as const,
      userId: user.id,
      email: user.email,
      sessionVersion: user.sessionVersion,
    };
  });
}

export async function disableMfa(input: {
  userId: string;
  password: string;
  code: string;
  ip?: string | null;
  now?: number;
}): Promise<MfaResult> {
  assertConfigured();

  return prisma.$transaction(async (tx) => {
    await lockUser(tx, input.userId);

    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        mfaEnabled: true,
        mfaSecretEncrypted: true,
        mfaLastUsedStep: true,
        sessionVersion: true,
        disabledAt: true,
      },
    });

    if (
      !user ||
      user.disabledAt ||
      !user.mfaEnabled ||
      !user.mfaSecretEncrypted
    ) {
      return { kind: "invalid" as const };
    }

    const passwordValid =
      await verifyPassword(
        input.password,
        user.passwordHash
      );

    if (!passwordValid) {
      await recordSecurityAudit(tx, {
        userId: user.id,
        type: "mfa.verification_failed",
        ip: input.ip,
        metadata: {
          operation: "disable",
          method: "password",
        },
      });

      return { kind: "invalid" as const };
    }

    let codeValid = false;

    if (isRecoveryCodeShaped(input.code)) {
      const codeHash = hashRecoveryCode(
        user.id,
        input.code
      );
      const found =
        await tx.mfaRecoveryCode.findFirst({
          where: {
            userId: user.id,
            codeHash,
            usedAt: null,
          },
          select: { id: true },
        });
      codeValid = Boolean(found);
    } else {
      let secret: string;

      try {
        secret = decryptSecret(
          user.mfaSecretEncrypted
        );
      } catch {
        throw new MfaConfigurationError(
          "MFA encryption is not configured."
        );
      }

      const step = verifyTotp(
        secret,
        input.code,
        {
          now: input.now,
        }
      );
      codeValid =
        step !== null &&
        isFreshStep(
          user.mfaLastUsedStep,
          step
        );
    }

    if (!codeValid) {
      await recordSecurityAudit(tx, {
        userId: user.id,
        type: "mfa.verification_failed",
        ip: input.ip,
        metadata: {
          operation: "disable",
          method: isRecoveryCodeShaped(input.code)
            ? "recovery"
            : "totp",
        },
      });

      return { kind: "invalid" as const };
    }

    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: false,
        mfaSecretEncrypted: null,
        mfaPendingSecretEncrypted: null,
        mfaPendingExpiresAt: null,
        mfaLastUsedStep: null,
        sessionVersion: {
          increment: 1,
        },
      },
      select: {
        id: true,
        email: true,
        sessionVersion: true,
      },
    });

    await tx.mfaRecoveryCode.deleteMany({
      where: { userId: user.id },
    });

    await recordSecurityAudit(tx, {
      userId: user.id,
      type: "mfa.disabled",
      ip: input.ip,
    });

    return {
      kind: "success" as const,
      userId: updated.id,
      email: updated.email,
      sessionVersion: updated.sessionVersion,
    };
  });
}

export function currentMfaStep(
  now = Date.now()
): number {
  return totpStep(now);
}
