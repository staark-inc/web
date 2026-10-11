import assert from "node:assert/strict";
import test from "node:test";
import { reconcileSite } from "../lib/saas/site-reconciliation.ts";

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
