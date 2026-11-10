import {
  createHash,
  randomBytes,
} from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeRecoveryCode(
  value: string
): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function generateRecoveryCodes(
  count = 10
): string[] {
  return Array.from({ length: count }, () => {
    const bytes = randomBytes(8);
    let code = "";

    for (const byte of bytes) {
      code += ALPHABET[byte & 31];
    }

    return `${code.slice(0, 4)}-${code.slice(4)}`;
  });
}

export function hashRecoveryCode(
  userId: string,
  code: string
): string {
  return createHash("sha256")
    .update(
      `staark-mfa-recovery:${userId}:${normalizeRecoveryCode(
        code
      )}`
    )
    .digest("hex");
}

export function isRecoveryCodeShaped(
  value: string
): boolean {
  return /^[A-Z0-9]{8}$/.test(
    normalizeRecoveryCode(value)
  );
}
