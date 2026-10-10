import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.SEO_CHECK_URL || "http://127.0.0.1:3000";
const conversionId = "2f3c0990-cc64-43e8-b3e3-9d7f516b226c";
const sendTo = "AW-18468720832/dUsbCJ3tlIIdEMChyeZE";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});

async function commands(page) {
  return page.evaluate(() => (window.dataLayer || []).map((entry) => Array.from(entry)));
}
async function conversionEvents(page) {
  return (await commands(page)).filter((c) => c[0] === "event" && c[1] === "conversion");
}
async function fill(page) {
  await page.locator("#contact-name").fill("Test Visitor");
  await page.locator("#contact-email").fill("test@example.com");
  await page.locator("#contact-message").fill("Test only; no real email.");
}

try {
  for (const [analytics, marketing] of [[false, false], [true, false], [false, true], [true, true]]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    // Never load a real Google library, emit conversions, or send real email.
    const googleRequests = [];
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.origin === new URL(origin).origin) return route.continue();
      if (url.hostname === "www.googletagmanager.com") googleRequests.push(url.href);
      return route.fulfill({ status: 200, contentType: "application/javascript", body: "/* external request mocked */" });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}/kontakt`);
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.equal(googleRequests.length, 0);
    await dialog.getByRole("button", { name: "Anpassa", exact: true }).click();
    await dialog.getByRole("checkbox", { name: "Tillåt statistik via Google Analytics" }).setChecked(analytics);
    await dialog.getByRole("checkbox", { name: "Tillåt annonsmätning via Google Ads" }).setChecked(marketing);
    if (process.env.GOOGLE_ADS_SCREENSHOT) await page.screenshot({ path: process.env.GOOGLE_ADS_SCREENSHOT });
    await dialog.getByRole("button", { name: "Spara val" }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await page.locator("#staark-google-tag").count(), analytics || marketing ? 1 : 0);
    assert.equal((await commands(page)).filter((c) => c[0] === "config" && c[1] === "AW-18468720832").length, marketing ? 1 : 0);
    assert.equal((await commands(page)).filter((c) => c[0] === "config" && String(c[1]).startsWith("G-")).length, analytics ? 1 : 0);
    assert.equal((await conversionEvents(page)).length, 0);

    let apiStatus = 429;
    let apiBody = { error: "rate limited" };
    let releaseResponse;
    let requested;
    const requestReceived = new Promise((resolve) => { requested = resolve; });
    const responseAllowed = new Promise((resolve) => { releaseResponse = resolve; });
    let firstRequest = true;
    await page.route("**/api/contact", async (route) => {
      if (firstRequest) {
        firstRequest = false;
        requested();
        await responseAllowed;
      }
      await route.fulfill({ status: apiStatus, contentType: "application/json", body: JSON.stringify(apiBody) });
    });
    await fill(page);
    await page.getByRole("button", { name: "Skicka meddelande" }).click();
    await requestReceived;
    assert.equal((await conversionEvents(page)).length, 0, "Button click or pending request must not convert");
    releaseResponse();
    await page.locator(".form-status.error").waitFor();
    assert.equal((await conversionEvents(page)).length, 0, "HTTP errors must not convert");

    // A generic 200 without explicit API success must remain an error.
    apiStatus = 200;
    apiBody = {};
    await page.getByRole("button", { name: "Skicka meddelande" }).click();
    await page.locator(".form-status.error").waitFor();
    assert.equal((await conversionEvents(page)).length, 0);

    // The honeypot returns success without a conversion ID.
    apiBody = { ok: true };
    await page.getByRole("button", { name: "Skicka meddelande" }).click();
    await page.locator(".form-status.success").waitFor();
    assert.equal((await conversionEvents(page)).length, 0, "Honeypot must not convert");

    apiBody = { ok: true, conversionId };
    await fill(page);
    await page.getByRole("button", { name: "Skicka meddelande" }).click();
    await page.locator(".form-status.success").waitFor();
    const conversions = await conversionEvents(page);
    assert.equal(conversions.length, marketing ? 1 : 0);
    if (marketing) assert.deepEqual(conversions[0][2], { send_to: sendTo, transaction_id: conversionId });
    assert.equal((await commands(page)).filter((c) => c[1] === "generate_lead").length, analytics ? 1 : 0);
    assert.doesNotMatch(JSON.stringify(await commands(page)), /test@example.com|Test Visitor|Test only/);

    // Repeated handling of the same server receipt cannot double count.
    await fill(page);
    await page.getByRole("button", { name: "Skicka meddelande" }).click();
    await page.locator(".form-status.success").waitFor();
    assert.equal((await conversionEvents(page)).length, marketing ? 1 : 0);
    await page.reload();
    await page.locator("#contact-name").waitFor();
    assert.equal((await conversionEvents(page)).length, 0, "Reloading /kontakt must not convert");

    if (analytics || marketing) {
      await page.getByRole("button", { name: /Cookie-inställningar/i }).click();
      await dialog.waitFor();
      await Promise.all([
        page.waitForEvent("domcontentloaded"),
        dialog.getByRole("button", { name: "Avvisa alla", exact: true }).click(),
      ]);
      await page.locator("#contact-name").waitFor();
      assert.equal(await page.locator("#staark-google-tag").count(), 0);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log("Google Ads browser checks passed: four consent combinations, pending/error/honeypot/success, deduplication, reload, revocation. All external requests and email were mocked.");
} finally {
  await browser.close();
}
