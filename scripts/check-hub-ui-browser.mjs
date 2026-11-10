#!/usr/bin/env node
/**
 * UI-01 accessibility and responsive browser checks for the foundation fixture.
 * Runs against the production build and test-only fixture route.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const origin = process.env.SEO_CHECK_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});

try {
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
    [768, 900],
    [390, 844],
    [320, 568],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "en-US",
      timezoneId: "UTC",
    });
    await context.addInitScript(() => {
      localStorage.setItem(
        "staark_cookie_consent_v2",
        JSON.stringify({
          version: 2,
          necessary: true,
          analytics: false,
          marketing: false,
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      );
    });
    await context.route("**/*", (request) => {
      const url = new URL(request.request().url());
      return url.origin === new URL(origin).origin ? request.continue() : request.abort();
    });

    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`${origin}/hub-ui-foundation`, { waitUntil: "load" });
    await page.locator("[data-sw-ui] h1").first().waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready);

    assert.equal(await page.locator("h1").count(), 1, `${width}px must have exactly one h1`);
    assert.equal(
      await page.locator('nav[aria-label="Foundation sections"] a[aria-current="page"]').count(),
      1,
      `${width}px tab strip must expose one current page`,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
      `${width}px must not overflow horizontally`,
    );

    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      const style = getComputedStyle(element);
      return {
        isBody: element === document.body,
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        boxShadow: style.boxShadow,
      };
    });
    assert.equal(focus.isBody, false, `${width}px Tab must move focus`);
    assert.ok(
      (focus.outlineStyle !== "none" && focus.outlineWidth > 0) ||
        focus.boxShadow !== "none",
      `${width}px focus must be visibly drawn`,
    );

    const axe = await new AxeBuilder({ page })
      .include("main")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      axe.violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        targets: nodes.map((node) => node.target),
      })),
      [],
      `${width}px axe violations`,
    );
    assert.deepEqual(pageErrors, [], `${width}px page errors`);

    await context.close();
    console.log(`PASS Hub UI foundation: ${width}x${height}, responsive, keyboard and axe.`);
  }
} finally {
  await browser.close();
}
