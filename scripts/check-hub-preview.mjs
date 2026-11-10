#!/usr/bin/env node
/**
 * STAARK-HUB-UI-PREVIEW-001 authenticated browser checks.
 *
 * Verifies the admin guard, noindex headers, all six preview sections, five
 * responsive widths, local interactions, dialog focus and axe WCAG 2.1 AA.
 */
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const origin = process.env.SEO_CHECK_URL || "http://127.0.0.1:3000";
const authSecret = process.env.AUTH_SECRET;

assert.ok(authSecret, "AUTH_SECRET must match the preview server for authenticated QA.");

const previewSession = await new SignJWT({
  email: "preview.qa@staark.example",
  role: "ADMIN",
})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject("preview-qa")
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(new TextEncoder().encode(authSecret));

const sections = ["dashboard", "collection", "detail", "forms", "settings", "shell"];
const viewports = [
  [1440, 900],
  [1024, 768],
  [768, 900],
  [390, 844],
  [320, 568],
];

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});

async function createContext(width, height, authenticated = true) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-US",
    timezoneId: "UTC",
  });

  if (authenticated) {
    await context.addCookies([
      {
        name: "staark_hub_session",
        value: previewSession,
        url: new URL(origin).origin,
        httpOnly: true,
        sameSite: "Lax",
        secure: origin.startsWith("https://"),
      },
    ]);
  }

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

  return context;
}

async function noOverflow(page) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
    "Preview must not overflow horizontally",
  );
}

async function axeViolations(page, include) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]);
  if (include) builder = builder.include(include);
  const results = await builder.analyze();
  return results.violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    targets: nodes.map((node) => node.target),
  }));
}

const pageErrors = [];

try {
  // Unauthenticated visitors are redirected to the real Hub login.
  const anonymous = await createContext(1440, 900, false);
  const anonymousPage = await anonymous.newPage();
  await anonymousPage.goto(`${origin}/hub/design-preview`, { waitUntil: "load" });
  await anonymousPage.waitForURL("**/hub/login");
  assert.equal(new URL(anonymousPage.url()).pathname, "/hub/login");
  await anonymous.close();
  console.log("PASS preview auth: unauthenticated visitors redirect to /hub/login.");

  // Preview response is noindex at both HTTP-header and document level.
  const headerContext = await createContext(1440, 900);
  const headerPage = await headerContext.newPage();
  const response = await headerPage.goto(`${origin}/hub/design-preview`, { waitUntil: "load" });
  assert.equal(response?.status(), 200);
  assert.match(response?.headers()["x-robots-tag"] || "", /noindex/i);
  assert.match(
    (await headerPage.locator('meta[name="robots"]').getAttribute("content")) || "",
    /noindex/i,
  );
  await headerContext.close();
  console.log("PASS preview indexing: noindex header and meta tag are present.");

  for (const [width, height] of viewports) {
    const context = await createContext(width, height);
    const page = await context.newPage();
    page.on("pageerror", (error) => pageErrors.push(`${width}px: ${error.message}`));
    const externalRequests = new Set();
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.origin !== new URL(origin).origin) externalRequests.add(url.origin);
    });

    for (const section of sections) {
      await page.goto(`${origin}/hub/design-preview?section=${section}`, { waitUntil: "load" });
      await page.locator("#preview-main h1").waitFor({ state: "visible" });
      assert.equal(await page.locator("h1").count(), 1, `${width}px ${section} must have one h1`);
      if (width > 768) {
        assert.equal(
          await page.locator('nav[aria-label="Preview sections"] button[aria-current="page"]:visible').count(),
          1,
          `${width}px ${section} must mark one visible current navigation item`,
        );
      } else {
        assert.equal(
          await page.locator('nav[aria-label="Breadcrumb"] [aria-current="page"]').count(),
          1,
          `${width}px ${section} must mark the current breadcrumb`,
        );
      }
      await noOverflow(page);
      assert.deepEqual(await axeViolations(page), [], `${width}px ${section} axe violations`);
    }

    assert.deepEqual([...externalRequests], [], `${width}px made external requests`);
    await context.close();
    console.log(`PASS preview sections and axe: ${width}x${height}.`);
  }

  // Desktop interactions: navigation, filtering, forms, dialog, settings and notifications.
  const desktop = await createContext(1440, 900);
  const page = await desktop.newPage();
  page.on("pageerror", (error) => pageErrors.push(`interaction: ${error.message}`));

  await page.goto(`${origin}/hub/design-preview?section=dashboard`, { waitUntil: "load" });
  const compactToggle = page.getByRole("button", { name: "Collapse navigation" });
  await compactToggle.click();
  assert.equal(await page.locator('[data-compact="true"]').count(), 1);
  const compactWidth = (await page.locator("aside").first().boundingBox())?.width || 0;
  assert.ok(compactWidth <= 90, "Compact sidebar should collapse to the icon rail");
  await page.getByRole("button", { name: "Expand navigation" }).click();
  assert.equal(await page.locator('[data-compact="false"]').count(), 1);

  await page.keyboard.press("Control+K");
  const searchDialog = page.getByRole("dialog", { name: "Search Staark" });
  await searchDialog.waitFor();
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("type")),
    "search",
    "Global search shortcut must focus the search input",
  );
  assert.deepEqual(await axeViolations(page, "dialog[open]"), []);
  await searchDialog.getByRole("searchbox", { name: "Search preview" }).fill("Northstar");
  await searchDialog.getByRole("button", { name: /Northstar Dental/ }).click();
  await page.getByRole("heading", { level: 1, name: "Clients" }).waitFor();

  await page.getByRole("searchbox", { name: "Search clients" }).fill("Northstar");
  await page.getByText("1 record", { exact: true }).waitFor();
  await page.getByRole("searchbox", { name: "Search clients" }).fill("");
  await page.getByRole("group", { name: "Filter by client status" })
    .getByRole("button", { name: /^At risk/ })
    .click();
  await page.getByText("3 records", { exact: true }).waitFor();

  await page.getByRole("button", { name: "Quick create" }).click();
  const quickCreate = page.getByRole("dialog", { name: "Quick create" });
  await quickCreate.waitFor();
  assert.deepEqual(await axeViolations(page, "dialog[open]"), []);
  await quickCreate.getByRole("button", { name: /New client/ }).click();
  await page.getByRole("heading", { level: 1, name: "Forms" }).waitFor();

  await page.getByRole("button", { name: "Review & save" }).click();
  await page.getByText("Enter a contact name.", { exact: true }).waitFor();
  await page.getByText("Enter an email address.", { exact: true }).waitFor();
  await page.getByLabel("Contact name").fill("Preview Person");
  await page.getByLabel("Email").fill("preview@staark.example");
  await page.getByRole("button", { name: "Review & save" }).click();
  const confirmDialog = page.getByRole("dialog", { name: "Save preview client?" });
  await confirmDialog.waitFor();
  assert.deepEqual(await axeViolations(page, "dialog[open]"), []);
  await confirmDialog.getByRole("button", { name: "Save preview" }).click();
  await page.getByText("Preview client saved locally.", { exact: false }).waitFor();

  await page.getByRole("button", { name: "Discard draft" }).click();
  const discardDialog = page.getByRole("dialog", { name: "Discard this draft?" });
  await discardDialog.waitFor();
  assert.deepEqual(await axeViolations(page, "dialog[open]"), []);
  await discardDialog.getByRole("button", { name: "Discard draft" }).click();
  assert.equal(await page.getByLabel("Contact name").inputValue(), "");

  await page.goto(`${origin}/hub/design-preview?section=settings`, { waitUntil: "load" });
  await page.getByRole("tab", { name: "Integrations" }).click();
  await page.getByRole("button", { name: "Connect" }).click();
  assert.equal(await page.getByRole("button", { name: "Manage" }).count(), 3);
  await page.getByRole("tab", { name: "Notifications" }).click();
  const digestSwitch = page.getByRole("switch", { name: "Weekly digest" });
  assert.equal(await digestSwitch.getAttribute("aria-checked"), "false");
  await digestSwitch.click();
  assert.equal(await digestSwitch.getAttribute("aria-checked"), "true");
  await page.getByRole("tab", { name: "Security" }).click();
  await page.getByRole("heading", { name: "TOTP authenticator enabled" }).waitFor();
  assert.deepEqual(await axeViolations(page, "#settings-panel-security"), []);

  await page.goto(`${origin}/hub/design-preview?section=shell`, { waitUntil: "load" });
  const navTrigger = page.getByRole("button", { name: "Mobile nav", exact: true });
  await navTrigger.click();
  const mobileDialog = page.getByRole("dialog", { name: "Preview navigation" });
  await mobileDialog.waitFor();
  assert.equal(
    await mobileDialog.evaluate((node) => node.contains(document.activeElement)),
    true,
    "Modal navigation must receive focus",
  );
  assert.deepEqual(await axeViolations(page, "dialog[open]"), []);
  await page.keyboard.press("Escape");
  await mobileDialog.waitFor({ state: "hidden" });
  assert.equal(await navTrigger.evaluate((node) => node === document.activeElement), true);

  const notificationsTrigger = page.getByRole("button", { name: "Notifications, 3 unread" });
  await notificationsTrigger.click();
  const notificationsDialog = page.getByRole("dialog", { name: "Notifications" });
  await notificationsDialog.waitFor();
  await notificationsDialog.getByRole("button", { name: "Mark all read" }).click();
  assert.equal(
    await page.getByRole("button", { name: "Notifications, 0 unread" }).count(),
    1,
    "Notification indicator must clear after local mark-all-read",
  );
  await page.keyboard.press("Escape");
  await notificationsDialog.waitFor({ state: "hidden" });
  await desktop.close();

  // Mobile navigation and shell behavior.
  const mobile = await createContext(390, 844);
  const mobilePage = await mobile.newPage();
  mobilePage.on("pageerror", (error) => pageErrors.push(`mobile: ${error.message}`));
  await mobilePage.goto(`${origin}/hub/design-preview?section=dashboard`, { waitUntil: "load" });
  const mobileTrigger = mobilePage.getByRole("button", { name: "Open preview navigation" });
  await mobileTrigger.click();
  const mobileNav = mobilePage.getByRole("dialog", { name: "Preview navigation" });
  await mobileNav.waitFor();
  assert.deepEqual(await axeViolations(mobilePage, "dialog[open]"), []);
  await mobileNav.getByRole("button", { name: /^Clients/ }).click();
  await mobilePage.getByRole("heading", { level: 1, name: "Clients" }).waitFor();
  await mobileNav.waitFor({ state: "hidden" });
  await noOverflow(mobilePage);

  await mobilePage.goto(`${origin}/hub/design-preview?section=settings`, { waitUntil: "load" });
  await mobilePage.getByLabel("Settings category").selectOption("security");
  await mobilePage.getByRole("heading", { name: "TOTP authenticator enabled" }).waitFor();
  await noOverflow(mobilePage);
  await mobile.close();

  assert.deepEqual(pageErrors, [], "Preview generated page errors");
  console.log("PASS preview interactions: compact nav, search, filters, quick create, forms, settings, security, shell, mobile nav.");
} finally {
  await browser.close();
}
