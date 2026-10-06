import assert from "node:assert/strict";
import { test } from "node:test";
import { CONTACT_MAX_BYTES, ContactInputError, contactSameOrigin, createContactLimiter, readContactBody } from "../lib/contact-intake.ts";

const request = (body: string, type = "application/json", headers = {}) => new Request("https://staarkinc.com/api/contact", { method: "POST", headers: { "Content-Type": type, ...headers }, body });

test("bounded JSON, URL encoded and multipart parsing preserve the existing contact fields", async () => {
  assert.deepEqual(await readContactBody(request('{"name":"Anna","fax":""}')), { name: "Anna", fax: "" });
  assert.deepEqual(await readContactBody(request("name=Anna&message=Hej%21", "application/x-www-form-urlencoded")), { name: "Anna", message: "Hej!" });
  const form = new FormData(); form.set("name", "Anna"); form.set("message", "Hej!");
  assert.deepEqual(await readContactBody(new Request("https://staarkinc.com/api/contact", { method: "POST", body: form })), { name: "Anna", message: "Hej!" });
});

test("malformed, non-object and unsupported bodies are client errors", async () => {
  for (const body of ["{", "null", "[]", '"text"']) {
    await assert.rejects(readContactBody(request(body)), (error) => error instanceof ContactInputError && error.status === 400);
  }
  await assert.rejects(readContactBody(request("text", "text/plain")), (error) => error instanceof ContactInputError && error.status === 415);
});

test("actual streamed bytes are bounded even with a dishonest Content-Length", async () => {
  let cancelled = false;
  const body = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(CONTACT_MAX_BYTES + 1)); }, cancel() { cancelled = true; } });
  const oversized = new Request("https://staarkinc.com/api/contact", { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": "1" }, body, duplex: "half" } as RequestInit);
  await assert.rejects(readContactBody(oversized), (error) => error instanceof ContactInputError && error.status === 413);
  assert.equal(cancelled, true);
});

test("cross-site browser submissions are rejected; same-origin and no-Origin clients remain supported", () => {
  assert.equal(contactSameOrigin(request("{}", "application/json", { Origin: "https://evil.example" })), false);
  assert.equal(contactSameOrigin(request("{}", "application/json", { Origin: "https://staarkinc.com" })), true);
  assert.equal(contactSameOrigin(request("{}", "application/json", { "Sec-Fetch-Site": "cross-site" })), false);
  assert.equal(contactSameOrigin(request("{}")), true);
});

test("email limits normalize case and expire; untrusted forwarding headers cannot create IP identities", () => {
  const limiter = createContactLimiter();
  for (let index = 0; index < 3; index++) assert.equal(limiter.email("ANNA@example.com", 1000), 0);
  assert.equal(limiter.email("anna@example.com", 1000), 600);
  assert.equal(limiter.email("anna@example.com", 601000), 0);
  const forwarded = request("{}", "application/json", { "cf-connecting-ip": "192.0.2.1" });
  for (let index = 0; index < 6; index++) assert.equal(limiter.request(forwarded, 1000, false), 0);
  const trusted = createContactLimiter();
  for (let index = 0; index < 5; index++) assert.equal(trusted.request(forwarded, 1000, true), 0);
  assert.equal(trusted.request(forwarded, 1000, true), 600);
});

test("a global request ceiling applies even when callers rotate identity headers", () => {
  const limiter = createContactLimiter();
  for (let index = 0; index < 60; index++) assert.equal(limiter.request(request("{}"), 1000, false), 0);
  assert.equal(limiter.request(request("{}"), 1000, false), 60);
  assert.equal(limiter.request(request("{}"), 61000, false), 0);
});
