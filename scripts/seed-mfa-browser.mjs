import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/secret-box";

const databaseUrl =
  process.env.DATABASE_URL ?? "";

if (
  !/^postgres(ql)?:\/\/[^@]+@(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//.test(
    databaseUrl
  )
) {
  throw new Error(
    "MFA browser seed requires a disposable local database."
  );
}

const email =
  process.env.MFA_BROWSER_EMAIL ??
  "mfa-browser@example.com";
const password =
  process.env.MFA_BROWSER_PASSWORD ??
  "Mfa-browser-password";
const secret =
  process.env.MFA_BROWSER_SECRET ??
  "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

const passwordHash = await bcrypt.hash(
  password,
  4
);

await prisma.rateLimitBucket.deleteMany({});

const user = await prisma.user.upsert({
  where: { email },
  update: {
    name: "MFA Browser Admin",
    passwordHash,
    mfaEnabled: true,
    mfaSecretEncrypted: encryptSecret(secret),
    mfaPendingSecretEncrypted: null,
    mfaPendingExpiresAt: null,
    mfaLastUsedStep: null,
    sessionVersion: 0,
    disabledAt: null,
  },
  create: {
    email,
    name: "MFA Browser Admin",
    passwordHash,
    mfaEnabled: true,
    mfaSecretEncrypted: encryptSecret(secret),
  },
});

await prisma.mfaRecoveryCode.deleteMany({
  where: { userId: user.id },
});

console.log(
  `Seeded MFA browser account ${email}.`
);

await prisma.$disconnect();
