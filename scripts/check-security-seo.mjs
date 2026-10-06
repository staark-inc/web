import assert from "node:assert/strict";

// Run against next start, then against the deployed origin after merging.
const origin = process.env.SEO_CHECK_URL || "http://localhost:3000";
const home = await fetch(origin);
assert.equal(home.status, 200);
for (const header of ["content-security-policy", "strict-transport-security", "x-content-type-options", "x-frame-options", "referrer-policy"]) {
  assert.ok(home.headers.get(header), `Missing ${header}`);
}
const html = await home.text();
const modified = home.headers.get("last-modified");
assert.ok(modified, "Missing Last-Modified on static public HTML");
assert.ok(home.headers.get("expires"), "Missing Expires on public HTML");
const validated = await fetch(origin, { headers: { "If-Modified-Since": modified } });
assert.equal(validated.status, 304, "Matching Last-Modified should return a body-free 304");
assert.equal(await validated.text(), "");
const stale = await fetch(origin, { headers: { "If-Modified-Since": "Thu, 01 Jan 1970 00:00:00 GMT" } });
assert.equal(stale.status, 200);
const asset = await fetch(new URL("/figma-v2/project-1.png", origin));
assert.equal(asset.status, 200);
assert.ok(Date.parse(asset.headers.get("expires") || "") > Date.now());
assert.match(html, /<title>Webbyrå &amp; webbdesign i Jönköping och Värnamo \| Staark Inc\.<\/title>/);
assert.match(html, /property="og:image"/);
assert.match(html, /name="twitter:card" content="summary_large_image"/);
assert.match(html, /name="twitter:image"/);
assert.doesNotMatch(html, /cdn-cgi\/l\/email-protection/);
const images = [...html.matchAll(/(?:property="og:image"|name="twitter:image") content="([^"]+)"/g)];
for (const [, url] of images) {
  // Local builds use the production metadataBase by default. Test the image
  // route on the origin under inspection, without calling the deployed image.
  const imageUrl = new URL(url.replaceAll("&amp;", "&"), origin);
  const response = await fetch(new URL(`${imageUrl.pathname}${imageUrl.search}`, origin));
  assert.equal(response.status, 200, `Social image unavailable: ${url}`);
  assert.match(response.headers.get("content-type") || "", /^image\//);
}
for (const city of ["Jönköping", "Värnamo", "Vaggeryd"]) assert.ok(html.includes(`Webbyrå i ${city}`));
const llms = await fetch(new URL("/llms.txt", origin));
assert.equal(llms.status, 200);
assert.match(llms.headers.get("content-type") || "", /^text\/markdown/);
const llmsText = await llms.text();
assert.match(llmsText, /^# Staark Inc\./);
for (const [, url] of llmsText.matchAll(/\]\((https:\/\/staarkinc\.com[^)]+)\)/g)) {
  assert.equal((await fetch(new URL(new URL(url).pathname, origin))).status, 200, `Broken discovery link: ${url}`);
}
const catalogResponse = await fetch(new URL("/.well-known/ai-catalog.json", origin));
assert.equal(catalogResponse.status, 200);
assert.match(catalogResponse.headers.get("content-type") || "", /^application\/ai-catalog\+json/);
const catalog = await catalogResponse.json();
assert.equal(catalog.specVersion, "1.0");
assert.equal(catalog.entries[0].url, "https://staarkinc.com/llms.txt");
assert.equal(catalog.entries[0].type, "text/markdown");
assert.match(home.headers.get("link") || "", /rel="ai-catalog"/);
const contact = await fetch(new URL("/kontakt", origin));
const contactHtml = await contact.text();
assert.equal(contact.status, 200);
assert.match(contactHtml, /href="mailto:contact@staarkinc.com"/);
assert.match(contactHtml, /<!--email_off--><a href="mailto:contact@staarkinc.com">/);
assert.doesNotMatch(contactHtml, /cdn-cgi\/l\/email-protection/);
for (const [body, type, status, extraHeaders] of [
  ["{", "application/json", 400, {}],
  ["[]", "application/json", 400, {}],
  ["x".repeat(65537), "application/json", 413, {}],
  ["text", "text/plain", 415, {}],
  ["{}", "application/json", 403, { Origin: "https://evil.example" }],
  ['{"fax":"bot"}', "application/json", 200, {}],
]) {
  const response = await fetch(new URL("/api/contact", origin), { method: "POST", headers: { "Content-Type": type, ...extraHeaders }, body });
  assert.equal(response.status, status, `Contact guard failed for expected ${status}`);
}
const saas = await fetch(new URL("/saas?billing=year&promo=GROWTH25", origin));
const saasHtml = await saas.text();
assert.equal(saas.status, 200);
assert.match(saasHtml, /<h1>En webbplats\. Rätt verktyg för varje steg\.<\/h1>/);
assert.match(saasHtml, /Rabatt aktiverad/);
assert.equal(saas.headers.get("last-modified"), null, "Dynamic SaaS content must not receive static validators");
const sitemap = await fetch(new URL("/sitemap.xml", origin));
assert.equal(sitemap.status, 200);
const xml = await sitemap.text();
assert.equal((xml.match(/<url>/g) || []).length, (xml.match(/<lastmod>/g) || []).length);
assert.match(xml, /\/saas<\/loc>/);
assert.doesNotMatch(xml, /\/hub|\/offert|\/saas\/(setup|checkout)/);
assert.doesNotMatch(xml, /\/(integritetspolicy|allmanna-villkor|kakor)<\/loc>/);
for (const [, url] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const pageUrl = new URL(url);
  const response = await fetch(new URL(pageUrl.pathname, origin));
  assert.equal(response.status, 200, `Sitemap URL is not healthy: ${url}`);
  assert.doesNotMatch(await response.text(), /name="robots" content="[^"]*noindex/);
}
for (const path of ["/hub/login", "/saas/setup", "/saas/checkout/success"]) {
  const response = await fetch(new URL(path, origin));
  assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
}
console.log(`Security/SEO smoke checks passed for ${origin}.`);
