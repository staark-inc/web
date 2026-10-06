import assert from "node:assert/strict";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const origin = process.env.SEO_CHECK_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  async function checkContrast() {
    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    assert.deepEqual(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })) })), [], `Contrast violations: ${page.url()}`);
  }
  await checkContrast();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  assert.equal(await dialog.evaluate((element) => element.contains(document.activeElement)), true);
  const first = dialog.getByRole("link").first();
  const last = dialog.getByRole("button", { name: "Anpassa" });
  await last.focus(); await page.keyboard.press("Tab");
  assert.equal(await first.evaluate((element) => element === document.activeElement), true);
  await first.focus(); await page.keyboard.press("Shift+Tab");
  assert.equal(await last.evaluate((element) => element === document.activeElement), true);
  await dialog.getByRole("button", { name: "Avvisa alla" }).click();
  await dialog.waitFor({ state: "hidden" });

  const menu = page.locator('button[aria-controls="site-navigation"]');
  await menu.click();
  assert.equal(await menu.getAttribute("aria-expanded"), "true");
  assert.equal(await page.locator("#site-navigation a").first().evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press("Escape");
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  assert.equal(await menu.evaluate((element) => element === document.activeElement), true);
  assert.equal(await page.locator('#site-navigation a[href="/blog"]').count(), 1);
  const cookieSettings = page.getByRole("button", { name: /Cookie-inställningar/i });
  await cookieSettings.click(); await dialog.waitFor();
  await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" });
  assert.equal(await cookieSettings.evaluate((element) => element === document.activeElement), true);

  await page.goto(`${origin}/saas?billing=year&promo=GROWTH25`);
  assert.equal(await page.getByRole("button", { name: "Årsvis", exact: true }).getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("#saas-promotion-code").inputValue(), "GROWTH25");
  assert.equal(await page.getByText("Rabatt aktiverad", { exact: true }).count(), 1);
  await page.getByRole("button", { name: "Månadsvis", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Månadsvis", exact: true }).getAttribute("aria-pressed"), "true");
  await page.locator("#saas-promotion-code").fill("GROWTH15");
  let checkoutPayload;
  await page.route("**/api/saas/checkout", async (route) => {
    checkoutPayload = route.request().postDataJSON();
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Test: betalningen startades inte." }) });
  });
  await page.locator(".site-package.featured button").click();
  await page.locator('.site-pricing [role="alert"]').waitFor();
  assert.equal(checkoutPayload.interval, "month");
  assert.equal(checkoutPayload.promotionCode, "GROWTH15");

  await page.goto(`${origin}/kontakt`);
  await page.route("**/api/contact", (route) => route.fulfill({ status: 429, contentType: "application/json", body: '{"error":"rate limited"}' }));
  await page.locator("#contact-name").fill("Test Visitor");
  await page.locator("#contact-email").fill("test@example.com");
  await page.locator("#contact-message").fill("Test only; no real email.");
  await page.getByRole("button", { name: "Skicka meddelande" }).click();
  await page.locator(".form-status.error").waitFor();
  assert.match(await page.locator(".form-status.error").textContent(), /För många meddelanden/);
  assert.equal(await page.locator("#contact-message").inputValue(), "Test only; no real email.");
  assert.deepEqual(errors, []);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(origin);
  const nav = await page.locator("#site-navigation").boundingBox();
  const brand = await page.locator(".site-navbar .site-brand").boundingBox();
  const actions = await page.locator(".site-nav-actions").boundingBox();
  assert.ok(nav && brand && actions);
  assert.ok(nav.x >= brand.x + brand.width, "Desktop navigation overlaps the brand");
  assert.ok(nav.x + nav.width <= actions.x, "Desktop navigation overlaps contact actions");
  assert.equal(await page.locator('#site-navigation a[href="/blog"]').isVisible(), true);
  for (const width of [390, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `Horizontal overflow at ${width}px`);
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(`${origin}/saas?billing=year&promo=GROWTH25`);
  assert.equal(await staticPage.getByRole("heading", { level: 1 }).count(), 1);
  assert.equal(await staticPage.locator(".site-package").count(), 3);
  assert.equal(await staticPage.getByText("Rabatt aktiverad", { exact: true }).count(), 1);
  await noJs.close();
  const sitemap = await (await context.request.get(`${origin}/sitemap.xml`)).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const path of [...paths, "/integritetspolicy", "/kakor", "/allmanna-villkor", "/contrast-check-missing-page"]) {
    await page.goto(`${origin}${path}`);
    await checkContrast();
  }
  const missingResponse = await page.goto(`${origin}/contrast-check-missing-page`);
  assert.equal(missingResponse.status(), 404);
  await page.getByRole("heading", { name: "Sidan kunde inte hittas" }).waitFor();
  await page.getByRole("link", { name: "Till startsidan", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
  assert.equal(new URL(page.url()).pathname, "/");
  if (process.env.CHECK_ERROR_FIXTURE === "1") {
    await page.goto(`${origin}/a11y-error-fixture`);
    await page.getByRole("heading", { name: "Något gick fel", exact: true }).waitFor();
    await checkContrast();
    await page.getByRole("button", { name: "Försök igen", exact: true }).click();
    await page.getByRole("heading", { name: "Något gick fel", exact: true }).waitFor();
    await page.getByRole("link", { name: "Till startsidan", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/");
  assert.equal(new URL(page.url()).pathname, "/");
  }
  await context.close();
  console.log("Public website browser checks passed (mobile focus, consent, SaaS SSR/pricing, mocked checkout/contact).");
} finally {
  await browser.close();
}
