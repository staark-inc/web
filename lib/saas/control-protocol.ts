import crypto from "node:crypto";

export const CONTROL_PROTOCOL_VERSION =
  "2" as const;

export type ControlSignedHeaders = {
  "X-Staark-Protocol": "2";
  "X-Staark-Timestamp": string;
  "X-Staark-Event-ID": string;
  "X-Staark-Sequence": string;
  "X-Staark-Signature": string;
};

export function controlBodyHash(
  body: string,
): string {
  return crypto
    .createHash("sha256")
    .update(body, "utf8")
    .digest("hex");
}

export function controlSignaturePayload(
  method: string,
  path: string,
  timestamp: string,
  eventId: string,
  sequence: string,
  body: string,
): string {
  return [
    method.toUpperCase(),
    path,
    timestamp,
    eventId,
    sequence,
    controlBodyHash(body),
  ].join("\n");
}

export function signControlRequest(
  input: {
    method: string;
    path: string;
    body?: string;
    eventId: string;
    sequence:
      | bigint
      | number
      | string;
    secret: string;
    now?: number;
  },
): ControlSignedHeaders {
  const timestamp =
    String(
      Math.floor(
        (input.now ?? Date.now()) /
          1000,
      ),
    );

  const sequence =
    String(
      input.sequence,
    );

  if (
    !/^\d+$/.test(sequence)
  ) {
    throw new Error(
      "Control protocol sequence must be a non-negative integer.",
    );
  }

  if (
    !/^[A-Za-z0-9:_.-]+$/.test(
      input.eventId,
    ) ||
    input.eventId.length > 160
  ) {
    throw new Error(
      "Control protocol eventId is invalid.",
    );
  }

  const signature =
    crypto
      .createHmac(
        "sha256",
        input.secret,
      )
      .update(
        controlSignaturePayload(
          input.method,
          input.path,
          timestamp,
          input.eventId,
          sequence,
          input.body ?? "",
        ),
        "utf8",
      )
      .digest("hex");

  return {
    "X-Staark-Protocol":
      CONTROL_PROTOCOL_VERSION,

    "X-Staark-Timestamp":
      timestamp,

    "X-Staark-Event-ID":
      input.eventId,

    "X-Staark-Sequence":
      sequence,

    "X-Staark-Signature":
      signature,
  };
}

export function controlPath(
  url: string,
): string {
  const parsed =
    new URL(url);

  return (
    parsed.pathname ||
    "/"
  );
}
