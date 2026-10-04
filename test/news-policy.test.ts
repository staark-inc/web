import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNewsUrl, parseNewsInput } from "../lib/news-policy.ts";
import { newsSameOrigin, readNewsBody } from "../lib/news-request.ts";
const draft = () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    title: "Release",
    summary: "Useful change",
    body: "## News",
    kind: "feature",
    bodyFormat: "markdown",
  }))
    form.set(key, value);
  return form;
};
test("unsafe destinations are blocked for links and images", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:image/svg+xml,test",
    "//evil.test/image",
    "https://user:pass@example.test",
    "https://example.test\\evil",
    "java\nscript:alert(1)",
    "/\\evil",
  ]) {
    assert.equal(safeNewsUrl(value), "");
    assert.equal(safeNewsUrl(value, true), "");
  }
  assert.equal(safeNewsUrl("mailto:support@example.test", true), "");
  assert.equal(safeNewsUrl("/admin/analytics"), "/admin/analytics");
  assert.equal(
    safeNewsUrl("https://example.test/image.webp", true),
    "https://example.test/image.webp",
  );
});
test("legacy text stays plain; Markdown and CTA are validated", () => {
  const form = draft();
  form.delete("bodyFormat");
  assert.equal(parseNewsInput(form).bodyFormat, "plain");
  form.set("ctaLabel", "Explore");
  assert.throws(() => parseNewsInput(form));
  form.set("ctaUrl", "javascript:alert(1)");
  assert.throws(() => parseNewsInput(form));
  form.set("ctaUrl", "/admin/analytics");
  assert.equal(parseNewsInput(form).ctaUrl, "/admin/analytics");
  form.set("kind", "unexpected");
  assert.throws(() => parseNewsInput(form));
});
test("lengths, audience and portable cover URLs are enforced on server", () => {
  const form = draft();
  form.set("title", "a".repeat(141));
  assert.throws(() => parseNewsInput(form));
  form.set("title", "Release");
  form.set("audiencePlan", "INVALID");
  assert.throws(() => parseNewsInput(form));
  form.set("audiencePlan", "BUSINESS");
  form.set("coverImageUrl", "/local.png");
  assert.throws(() => parseNewsInput(form));
});
test("mutation origin rejects a foreign site", () => {
  const request = (origin: string) =>
    new Request("http://localhost:3000/api/hub/updates", {
      method: "POST",
      headers: { origin },
    });
  assert.equal(newsSameOrigin(request("http://localhost:3000")), true);
  assert.equal(newsSameOrigin(request("https://evil.test")), false);
});
test("actual streamed bytes are bounded without Content-Length", async () => {
  const request = new Request("http://localhost/", {
    method: "POST",
    body: "oversized",
  });
  await assert.rejects(() => readNewsBody(request, 3), /too large/);
  assert.equal(
    (
      await readNewsBody(
        new Request("http://localhost/", { method: "POST", body: "ok" }),
        3,
      )
    ).byteLength,
    2,
  );
});

test("Markdown indentation is preserved when validating the body", () => {
  const form = draft();
  form.set("body", "    indented code\n");
  assert.equal(parseNewsInput(form).body, "    indented code\n");
});
