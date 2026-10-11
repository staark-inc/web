import assert from "node:assert/strict";
import test from "node:test";
import { mapWithConcurrency, reconcileSite } from "../lib/saas/site-reconciliation.ts";

const expected = { siteId: "site-1", hostname: "example.staark.app" };
const healthy = {
  reachable: true,
  ok: true,
  site: {
    exists: true,
    id: "site-1",
    setupCompleted: true,
    domains: [{ hostname: "example.staark.app", type: "platform", verified: true, primaryDomain: true, sslStatus: "ready" }],
  },
};

test("matching runtime", () => {
  assert.equal(reconcileSite(expected, healthy).state, "matched");
});
test("missing binding is incomplete", () => {
  assert.equal(reconcileSite({ siteId: "site-1", hostname: null }, healthy).state, "incomplete");
});
test("offline runtime is unavailable, not drift", () => {
  assert.equal(reconcileSite(expected, { reachable: false, ok: false, error: "timeout" }).state, "unavailable");
});
test("different runtime site ID is drift", () => {
  assert.equal(reconcileSite(expected, { ...healthy, site: { ...healthy.site, id: "site-other" } }).state, "drift");
});
test("missing expected domain is drift", () => {
  assert.equal(reconcileSite(expected, { ...healthy, site: { ...healthy.site, domains: [] } }).state, "drift");
});
test("unsupplied domains are not treated as empty", () => {
  assert.equal(reconcileSite(expected, { ...healthy, site: { exists: true, id: "site-1" } }).state, "matched");
});

test("bounded checks preserve input order and concurrency", async () => {
  let active = 0;
  let peak = 0;
  const output = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (value) => {
    active++;
    peak = Math.max(peak, active);
    await new Promise<void>((resolve) => setImmediate(resolve));
    active--;
    return value * 10;
  });
  assert.deepEqual(output, [10, 20, 30, 40, 50, 60]);
  assert.equal(peak, 2);
});
test("empty input starts no health requests", async () => {
  const results = await mapWithConcurrency([], 4, async () => {
    throw new Error("unexpected health request");
  });
  assert.deepEqual(results, []);
});
test("rejects invalid concurrency", async () => {
  await assert.rejects(mapWithConcurrency([1], 0, async (x) => x), RangeError);
});
test("runtime reports site missing as drift", () => {
  assert.equal(reconcileSite(expected, { reachable: true, ok: true, site: { exists: false, id: "site-1" } }).state, "drift");
});
test("runtime setup unfinished is drift", () => {
  assert.equal(reconcileSite(expected, { ...healthy, site: { ...healthy.site, setupCompleted: false } }).state, "drift");
});
test("unhealthy runtime database is drift", () => {
  assert.equal(reconcileSite(expected, { ...healthy, database: { ok: false } }).state, "drift");
});
