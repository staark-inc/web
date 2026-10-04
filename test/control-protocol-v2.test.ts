import assert from "node:assert/strict";
import test from "node:test";

import crypto from "node:crypto";

import {
  controlBodyHash,
  controlPath,
  controlSignaturePayload,
  signControlRequest,
} from "../lib/saas/control-protocol.ts";

const SECRET =
  "hub-runtime-test-secret";

test(
  "control v2 signs method path event sequence and body hash",
  () => {
    const body =
      JSON.stringify({
        status:
          "active",
      });

    const signed =
      signControlRequest({
        method:
          "POST",

        path:
          "/api/staark/subscription/sync",

        body,

        eventId:
          "subscription:sub_test:7",

        sequence:
          7,

        secret:
          SECRET,

        now:
          1_800_000_000_000,
      });

    assert.equal(
      signed[
        "X-Staark-Protocol"
      ],
      "2",
    );

    assert.equal(
      signed[
        "X-Staark-Sequence"
      ],
      "7",
    );

    assert.equal(
      signed[
        "X-Staark-Event-ID"
      ],
      "subscription:sub_test:7",
    );

    const payload =
      controlSignaturePayload(
        "POST",
        "/api/staark/subscription/sync",
        signed[
          "X-Staark-Timestamp"
        ],
        signed[
          "X-Staark-Event-ID"
        ],
        signed[
          "X-Staark-Sequence"
        ],
        body,
      );

    const expected =
      crypto
        .createHmac(
          "sha256",
          SECRET,
        )
        .update(
          payload,
          "utf8",
        )
        .digest("hex");

    assert.equal(
      signed[
        "X-Staark-Signature"
      ],
      expected,
    );
  },
);

test(
  "body hash is SHA-256 hex",
  () => {
    assert.equal(
      controlBodyHash(""),
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  },
);

test(
  "control path uses only URL pathname",
  () => {
    assert.equal(
      controlPath(
        "http://runtime:3000/api/staark/subscription/sync",
      ),
      "/api/staark/subscription/sync",
    );
  },
);

test(
  "invalid event ids and sequences fail closed",
  () => {
    assert.throws(
      () =>
        signControlRequest({
          method:
            "POST",
          path:
            "/api/test",
          eventId:
            "bad event id",
          sequence:
            1,
          secret:
            SECRET,
        }),
    );

    assert.throws(
      () =>
        signControlRequest({
          method:
            "POST",
          path:
            "/api/test",
          eventId:
            "valid:event",
          sequence:
            "-1",
          secret:
            SECRET,
        }),
    );
  },
);
