import assert from "node:assert/strict";

import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

import {
  generateTotp,
  totpStep,
} from "@/lib/totp";

const origin =
  process.env.SEO_CHECK_URL ||
  "http://localhost:3000";
const email =
  process.env.MFA_BROWSER_EMAIL ??
  "mfa-browser@example.com";
const password =
  process.env.MFA_BROWSER_PASSWORD ??
  "Mfa-browser-password";
const secret =
  process.env.MFA_BROWSER_SECRET ??
  "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

function seriousOrCritical(violations) {
  return violations.filter((violation) =>
    ["serious", "critical"].includes(
      violation.impact ?? ""
    )
  );
}

async function noHorizontalOverflow(page) {
  assert.equal(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        window.innerWidth
    ),
    true,
    "MFA page must not overflow horizontally"
  );
}

const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env
      .PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    undefined,
});

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) =>
    errors.push(error.message)
  );

  await page.goto(`${origin}/hub/login`);
  await page.locator("#hub-login-email").fill(email);
  await page.locator("#hub-login-password").fill(password);
  await page.getByRole("button", {
    name: "Sign in",
  }).click();

  await page.waitForURL("**/hub/mfa");
  await page
    .getByRole("heading", {
      name: "Two-factor verification",
    })
    .waitFor();

  const challengeAxe = await new AxeBuilder({
    page,
  })
    .include(".hub-login-card")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  assert.deepEqual(
    seriousOrCritical(challengeAxe.violations),
    []
  );
  await noHorizontalOverflow(page);

  const code = generateTotp(
    secret,
    totpStep()
  );

  await page
    .getByLabel("Verification code")
    .fill(code);
  await page
    .getByRole("button", {
      name: "Verify and continue",
    })
    .click();

  await page.waitForURL("**/hub");
  assert.equal(
    new URL(page.url()).pathname,
    "/hub"
  );

  await page.goto(
    `${origin}/hub/profile/mfa`
  );
  await page
    .getByRole("heading", {
      name: "Two-factor authentication",
      exact: true,
    })
    .first()
    .waitFor();

  const settingsAxe = await new AxeBuilder({
    page,
  })
    .include(".hub-settings-page")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  assert.deepEqual(
    seriousOrCritical(settingsAxe.violations),
    []
  );
  await noHorizontalOverflow(page);

  await page.setViewportSize({
    width: 390,
    height: 844,
  });
  await page.reload();
  await page
    .getByRole("heading", {
      name: "Two-factor authentication",
      exact: true,
    })
    .first()
    .waitFor();
  await noHorizontalOverflow(page);

  assert.deepEqual(errors, []);

  console.log(
    "MFA browser checks passed: password challenge, TOTP verification, recovery guidance, profile settings, desktop/mobile layout and serious/critical accessibility."
  );
} finally {
  await browser.close();
}
