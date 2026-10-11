import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import test from "node:test";

import { getRuntimeSiteHealth } from "../lib/saas/runtime-health.ts";
import { reconcileSite } from "../lib/saas/site-reconciliation.ts";

test("signed runtime HTTP responses classify matched, drift and unavailable", async () => {
  const secret = "qa-runtime-health-fixture-secret";
  const expected = { siteId: "qa-matched", hostname: "matched.example.test" };
  const ids: string[] = [];
  let validSignatures = 0;
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString("utf8");
    const timestamp = req.headers["x-staark-timestamp"] as string | undefined;
    const signature = req.headers["x-staark-signature"] as string | undefined;
    const calculated = createHmac("sha256", secret)
      .update(`${timestamp}.${body}`).digest("hex");
    const okSignature = !!signature && /^[a-f0-9]{64}$/.test(signature) &&
      timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(calculated, "hex"));
    if (req.method !== "POST" || req.url !== "/api/staark/health" || !okSignature) {
      res.writeHead(403).end();
      return;
    }
    validSignatures++;
    const { siteId } = JSON.parse(body) as { siteId: string };
    ids.push(siteId);
    if (siteId === "qa-unavailable") {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Fixture runtime unavailable" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      site: {
        exists: true,
        id: siteId === "qa-drift" ? "unexpected-runtime-id" : siteId,
        setupCompleted: true,
        domains: [{ hostname: siteId === "qa-drift" ? "other.example.test" : "matched.example.test" }],
      },
      database: { ok: true },
    }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  const previousUrl = process.env.STAARK_RUNTIME_INTERNAL_URL;
  const previousSecret = process.env.STAARK_PROVISIONING_SECRET;
  process.env.STAARK_RUNTIME_INTERNAL_URL = `http://127.0.0.1:${address.port}`;
  process.env.STAARK_PROVISIONING_SECRET = secret;
  try {
    const matched = await getRuntimeSiteHealth("qa-matched");
    const drift = await getRuntimeSiteHealth("qa-drift");
    const unavailable = await getRuntimeSiteHealth("qa-unavailable");
    assert.equal(reconcileSite(expected, matched).state, "matched");
    assert.equal(reconcileSite({ siteId: "qa-drift", hostname: expected.hostname }, drift).state, "drift");
    assert.equal(reconcileSite({ siteId: "qa-unavailable", hostname: expected.hostname }, unavailable).state, "unavailable");
    assert.deepEqual(ids, ["qa-matched", "qa-drift", "qa-unavailable"]);
    assert.equal(validSignatures, 3);
  } finally {
    if (previousUrl === undefined) delete process.env.STAARK_RUNTIME_INTERNAL_URL;
    else process.env.STAARK_RUNTIME_INTERNAL_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.STAARK_PROVISIONING_SECRET;
    else process.env.STAARK_PROVISIONING_SECRET = previousSecret;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
