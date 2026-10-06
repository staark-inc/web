import assert from "node:assert/strict";
import { test } from "node:test";
import { canReturnNotModified, publicHtmlCacheHeaders } from "../lib/public-http-cache.ts";

const buildTime = "Tue, 06 Oct 2026 20:00:00 GMT";
const req = (headers: HeadersInit, method = "GET") => new Request("https://staarkinc.com/", { headers, method });
test("conditional HTML responses validate the current build and honor ETag precedence", () => {
  assert.equal(canReturnNotModified(req({ "If-Modified-Since": buildTime }), buildTime), true);
  assert.equal(canReturnNotModified(req({ "If-Modified-Since": buildTime }, "HEAD"), buildTime), true);
  assert.equal(canReturnNotModified(req({ "If-Modified-Since": "Tue, 06 Oct 2026 19:00:00 GMT" }), buildTime), false);
  assert.equal(canReturnNotModified(req({ "If-Modified-Since": "invalid" }), buildTime), false);
  assert.equal(canReturnNotModified(req({ "If-Modified-Since": buildTime, "If-None-Match": '"different"' }), buildTime), false);
  assert.equal(canReturnNotModified(req({ "If-Modified-Since": buildTime, RSC: "1" }), buildTime), false);
  assert.equal(canReturnNotModified(req({ "If-Modified-Since": buildTime }, "POST"), buildTime), false);
});
test("Last-Modified describes the build while Expires agrees with browser max-age=0", () => {
  const now = new Date("2026-10-06T21:00:00Z");
  const headers = publicHtmlCacheHeaders(buildTime, now);
  assert.equal(headers["Last-Modified"], buildTime);
  assert.equal(headers.Expires, now.toUTCString());
  assert.match(headers["Cache-Control"], /max-age=0/);
  assert.match(headers.Vary, /RSC/);
});
