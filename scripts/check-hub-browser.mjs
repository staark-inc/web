import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const origin = process.env.SEO_CHECK_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
const screenshotDir = process.env.HUB_SCREENSHOT_DIR;
if (screenshotDir) await mkdir(screenshotDir, { recursive: true });
const seed = () => Array.from({ length: 20 }, (_, i) => ({
  id: String(i), type: ["lead.created", "inbox.received", "offer.accepted", "billing.paid"][i % 4],
  title: ["New website enquiry", "Customer replied to your message", "Offer accepted", "Invoice payment received"][i % 4],
  message: i === 0 ? "A customer would like to discuss a new website. Open the lead to see their requirements and plan your next step." : "New activity in your workspace. Review the details when you are ready.",
  href: null, readAt: i < 4 ? null : new Date().toISOString(), createdAt: new Date(Date.now() - i * 60000).toISOString(),
}));
const waitIdle = (page) => page.waitForFunction(() => document.querySelector('.hub-notification-list')?.getAttribute('aria-busy') === 'false');
async function inViewport(locator, page) {
  const box = await locator.boundingBox();
  const { width, height } = page.viewportSize();
  assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1, `Outside viewport: ${JSON.stringify(box)} / ${width}x${height}`);
}
async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "No horizontal page overflow");
}
try {
  for (const [width, height, compact] of [[1440, 900, false], [1024, 768, true], [768, 900, false], [390, 844, false], [320, 568, true]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addInitScript(() => localStorage.setItem("staark_cookie_consent_v2", JSON.stringify({ version: 2, necessary: true, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    await context.route("**/*", (route) => new URL(route.request().url()).origin === new URL(origin).origin ? route.continue() : route.abort());
    let items = seed();
    let failRead = false;
    let failRefresh = false;
    let patchCount = 0;
    let releasePatch;
    let patchGate;
    await context.route("**/api/hub/notifications", async (route) => {
      if (route.request().method() === "PATCH") {
        patchCount++;
        if (patchGate) await patchGate;
        if (failRead) return route.fulfill({ status: 500, json: { error: "Test failure" } });
        const { id } = route.request().postDataJSON();
        items = items.map((n) => !id || n.id === id ? { ...n, readAt: new Date().toISOString() } : n);
        return route.fulfill({ json: { ok: true } });
      }
      if (failRefresh) return route.fulfill({ status: 503, json: { error: "Offline" } });
      return route.fulfill({ json: { notifications: items, unread: items.filter((n) => !n.readAt).length } });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const path = `${origin}/hub-ui-fixture${compact ? "?compact=1" : ""}`;
    await page.goto(path);
    await noOverflow(page);
    if (width <= 600) {
      await inViewport(page.getByRole("button", { name: "Open navigation" }), page);
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page.getByRole("navigation", { name: "Hub navigation" }).waitFor();
      await noOverflow(page);
      await inViewport(page.getByRole("button", { name: "Sign out" }), page);
      if (screenshotDir && width === 390) await page.screenshot({ path: `${screenshotDir}/hub-mobile-menu.png` });
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("navigation", { name: "Hub navigation" }).isVisible(), false);
      assert.equal(await page.getByRole("button", { name: "Open navigation" }).evaluate((node) => node === document.activeElement), true);
    }
    // Force the exact original failure condition: an ancestor clips its children.
    await page.locator(".hub-sidebar").evaluate((node) => { node.style.overflow = "hidden"; });
    const trigger = page.getByRole("button", { name: /^Notifications/ });
    await inViewport(trigger, page);
    if (screenshotDir && width === 1440) await page.screenshot({ path: `${screenshotDir}/hub-projects-desktop.png` });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Notifications" });
    await dialog.waitFor();
    await waitIdle(page);
    assert.equal(await dialog.locator("article").count(), 20);
    await inViewport(dialog, page);
    await inViewport(dialog.locator("footer"), page);
    assert.equal(await dialog.evaluate((node) => node.matches(":modal") && node.contains(document.activeElement)), true);
    // Shift+Tab from close must wrap to the footer and remain inside the dialog.
    await page.keyboard.press("Shift+Tab");
    assert.equal(await dialog.evaluate((node) => node.contains(document.activeElement)), true);
    if (screenshotDir && [1440, 390, 320].includes(width)) await page.screenshot({ path: `${screenshotDir}/hub-notifications-${width}.png` });
    const axe = await new AxeBuilder({ page }).include(".hub-notification-dialog").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    assert.deepEqual(axe.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((n) => n.target) })), []);
    await dialog.locator("article").last().scrollIntoViewIfNeeded();
    await inViewport(dialog.locator("article").last(), page);
    await inViewport(dialog.locator("footer"), page);
    await dialog.getByRole("button", { name: /^Unread/ }).click();
    assert.equal(await dialog.locator("article").count(), 4);
    failRead = true;
    await dialog.getByRole("button", { name: "Mark all as read", exact: true }).click();
    await dialog.getByRole("alert").waitFor();
    assert.equal(await dialog.locator(".is-unread").count(), 4, "Failed save preserves unread items");
    assert.equal(await trigger.getAttribute("aria-label"), "Notifications, 4 unread");
    failRead = false;
    patchGate = new Promise((resolve) => { releasePatch = resolve; });
    await page.waitForFunction(() => !document.querySelector('.hub-notification-read-all')?.disabled);
    const before = patchCount;
    await dialog.getByRole("button", { name: "Mark all as read", exact: true }).click();
    assert.equal(await dialog.getByRole("button", { name: "Mark all as read", exact: true }).isDisabled(), true);
    releasePatch();
    patchGate = null;
    await dialog.getByText("You're all caught up").waitFor();
    await waitIdle(page);
    assert.equal(patchCount, before + 1);
    assert.equal(await trigger.getAttribute("aria-label"), "Notifications");
    await dialog.getByRole("button", { name: "All activity", exact: true }).click();
    failRefresh = true;
    await dialog.getByRole("button", { name: "Refresh notifications" }).click();
    await dialog.getByRole("alert").waitFor();
    assert.equal(await dialog.locator("article").count(), 20, "Failed refresh preserves list");
    failRefresh = false;
    items = seed().slice(0, 1);
    await dialog.getByRole("button", { name: "Refresh notifications" }).click();
    await waitIdle(page);
    assert.equal(await dialog.getByRole("alert").count(), 0);
    await dialog.getByRole("button", { name: /^Mark as read:/ }).click();
    await page.waitForFunction(() => document.querySelectorAll('.hub-notification-item.is-unread').length === 0);
    await waitIdle(page);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
    await page.waitForFunction(() => document.body.style.overflow === "" && document.querySelector(".hub-notification-trigger")?.getAttribute("aria-expanded") === "false");
    await trigger.click();
    await dialog.waitFor();
    await page.mouse.click(2, 2);
    await dialog.waitFor({ state: "hidden" });
    await page.goto(`${path}${compact ? "&" : "?"}view=preferences`);
    await noOverflow(page);
    if (screenshotDir && width === 390) await page.screenshot({ path: `${screenshotDir}/hub-preferences-mobile.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`Hub browser checks passed: ${width}x${height}, ${compact ? "compact" : "standard"}.`);
  }
} finally { await browser.close(); }
