import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const BASE32_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_DIGITS = 6;

export function encodeBase32(
  input: Buffer
): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output +=
        BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output +=
      BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function decodeBase32(
  input: string
): Buffer {
  const normalized = input
    .toUpperCase()
    .replace(/=+$/g, "")
    .replace(/\s+/g, "");

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const character of normalized) {
    const index =
      BASE32_ALPHABET.indexOf(character);

    if (index < 0) {
      throw new Error("Invalid base32 value.");
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(
  bytes = 20
): string {
  return encodeBase32(randomBytes(bytes));
}

export function totpStep(
  now = Date.now()
): number {
  return Math.floor(
    now / 1000 / TOTP_PERIOD_SECONDS
  );
}

export function generateTotp(
  secret: string,
  step: number,
  digits = TOTP_DIGITS
): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));

  const digest = createHmac(
    "sha1",
    decodeBase32(secret)
  )
    .update(counter)
    .digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(
    binary % 10 ** digits
  ).padStart(digits, "0");
}

export function verifyTotp(
  secret: string,
  code: string,
  options: {
    now?: number;
    window?: number;
    digits?: number;
  } = {}
): number | null {
  const digits = options.digits ?? TOTP_DIGITS;
  const normalized = code.trim();

  if (!new RegExp(`^\\d{${digits}}$`).test(normalized)) {
    return null;
  }

  const current = totpStep(
    options.now ?? Date.now()
  );
  const window = options.window ?? 1;

  for (
    let offset = 0;
    offset <= window;
    offset++
  ) {
    for (const step of offset === 0
      ? [current]
      : [current - offset, current + offset]) {
      if (step < 0) continue;

      const expected = generateTotp(
        secret,
        step,
        digits
      );
      const expectedBuffer = Buffer.from(expected);
      const receivedBuffer = Buffer.from(normalized);

      if (
        expectedBuffer.length ===
          receivedBuffer.length &&
        timingSafeEqual(
          expectedBuffer,
          receivedBuffer
        )
      ) {
        return step;
      }
    }
  }

  return null;
}

export function totpUri(input: {
  issuer: string;
  account: string;
  secret: string;
  digits?: number;
  period?: number;
}): string {
  const issuer = input.issuer.trim();
  const account = input.account.trim();
  const label = `${issuer}:${account}`;
  const params = new URLSearchParams({
    secret: input.secret,
    issuer,
    algorithm: "SHA1",
    digits: String(input.digits ?? TOTP_DIGITS),
    period: String(
      input.period ?? TOTP_PERIOD_SECONDS
    ),
  });

  return `otpauth://totp/${encodeURIComponent(
    label
  )}?${params.toString()}`;
}
