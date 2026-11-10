import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const VERSION = "v1";

function decodeKey(value: string): Buffer {
  const trimmed = value.trim();

  if (/^[0-9a-f]{64}$/i.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  const decoded = Buffer.from(trimmed, "base64");

  if (decoded.length !== 32) {
    throw new Error(
      "MFA_ENCRYPTION_KEY must be 32 bytes encoded as base64 or hex."
    );
  }

  return decoded;
}

export function mfaEncryptionKey(
  env = process.env
): Buffer {
  const value = env.MFA_ENCRYPTION_KEY?.trim();

  if (!value) {
    throw new Error(
      "MFA_ENCRYPTION_KEY is not configured."
    );
  }

  return decodeKey(value);
}

export function mfaEncryptionConfigured(
  env = process.env
): boolean {
  try {
    return mfaEncryptionKey(env).length === 32;
  } catch {
    return false;
  }
}

export function encryptSecret(
  plaintext: string,
  key = mfaEncryptionKey()
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    key,
    iv
  );
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptSecret(
  value: string,
  key = mfaEncryptionKey()
): string {
  const parts = value.split(".");

  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error(
      "Invalid encrypted secret."
    );
  }

  const iv = Buffer.from(parts[1], "base64url");
  const tag = Buffer.from(parts[2], "base64url");
  const ciphertext = Buffer.from(
    parts[3],
    "base64url"
  );

  if (iv.length !== 12 || tag.length !== 16) {
    throw new Error(
      "Invalid encrypted secret."
    );
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    iv
  );
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
