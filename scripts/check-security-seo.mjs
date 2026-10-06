import assert from "node:assert/strict";

// Run against next start, then against the deployed origin after merging.
const origin = process.env.SEO_CHECK_URL || "http://localhost:3000";
const home = await fetch(origin);
assert.equal(home.status, 200);
for (const header of ["content-security-policy", "strict-transport-security", "x-content-type-options", "x-frame-options", "referrer-policy"]) {
  assert.ok(home.headers.get(header), `Missing ${header}`);
}
const html = await home.text();
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
const contact = await fetch(new URL("/kontakt", origin));
const contactHtml = await contact.text();
assert.equal(contact.status, 200);
assert.match(contactHtml, /href="mailto:contact@staarkinc.com"/);
assert.match(contactHtml, /<!--email_off--><a href="mailto:contact@staarkinc.com">/);
assert.doesNotMatch(contactHtml, /cdn-cgi\/l\/email-protection/);
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
