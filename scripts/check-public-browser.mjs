import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.SEO_CHECK_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
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
  await page.locator(".v2-package.featured button").click();
  await page.getByRole("alert").waitFor();
  assert.equal(checkoutPayload.interval, "month");
  assert.equal(checkoutPayload.promotionCode, "GROWTH15");

  await page.goto(`${origin}/kontakt`);
  await page.route("**/api/contact", (route) => route.fulfill({ status: 429, contentType: "application/json", body: '{"error":"rate limited"}' }));
  await page.locator("#contact-name").fill("Test Visitor");
  await page.locator("#contact-email").fill("test@example.com");
  await page.locator("#contact-message").fill("Test only; no real email.");
  await page.getByRole("button", { name: "Skicka meddelande" }).click();
  await page.getByRole("alert").waitFor();
  assert.match(await page.getByRole("alert").textContent(), /För många meddelanden/);
  assert.equal(await page.locator("#contact-message").inputValue(), "Test only; no real email.");
  assert.deepEqual(errors, []);

  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(`${origin}/saas?billing=year&promo=GROWTH25`);
  assert.equal(await staticPage.getByRole("heading", { level: 1 }).count(), 1);
  assert.equal(await staticPage.locator(".v2-package").count(), 3);
  assert.equal(await staticPage.getByText("Rabatt aktiverad", { exact: true }).count(), 1);
  await noJs.close(); await context.close();
  console.log("Public website browser checks passed (mobile focus, consent, SaaS SSR/pricing, mocked checkout/contact).");
} finally {
  await browser.close();
}
