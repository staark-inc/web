#!/usr/bin/env node
/**
 * Deterministic Hub visual regression check.
 *
 * Run against a production build: `npm run check:hub-visual`.
 * Create/refresh baselines on the same Linux + Playwright image used by CI:
 *   HUB_VISUAL_UPDATE=1 npm run check:hub-visual
 *
 * Routes: authenticated-shell fixture, login, the test-only foundation fixture
 * and all six authenticated design-preview sections. Fonts are bundled by
 * next/font, animations are disabled and all external requests are blocked.
 *
 * AUTH_SECRET must match the running server so the preview session cookie is
 * accepted. The cookie is test-only and never used outside browser checks.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SignJWT } from "jose";
import { chromium } from "playwright";
import sharp from "sharp";

const origin = process.env.SEO_CHECK_URL || "http://127.0.0.1:3000";
const baselineDir = join(process.cwd(), "test", "visual", "hub");
const outputDir = join(process.cwd(), "test-results", "hub-visual");
const update = process.env.HUB_VISUAL_UPDATE === "1" || process.argv.includes("--update");
const maxDiffRatio = Number(process.env.HUB_VISUAL_MAX_DIFF_RATIO || "0.001");
const pixelThreshold = Number(process.env.HUB_VISUAL_PIXEL_THRESHOLD || "16");

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

const previewSections = [
  "dashboard",
  "collection",
  "detail",
  "forms",
  "settings",
  "shell",
];

const routes = [
  { name: "hub-workspace", path: "/hub-ui-fixture", ready: ".hub-page" },
  { name: "foundation", path: "/hub-ui-foundation", ready: "[data-sw-ui] h1" },
  { name: "login", path: "/hub/login", ready: ".hub-login-card" },
  ...previewSections.map((section) => ({
    name: `preview-${section}`,
    path: `/hub/design-preview?section=${section}`,
    ready: "#preview-main h1",
    auth: true,
  })),
];

const authSecret = process.env.AUTH_SECRET;
if (!authSecret) {
  console.error("AUTH_SECRET is required for the authenticated design-preview visual routes.");
  process.exit(1);
}

const previewSession = await new SignJWT({
  email: "preview.qa@staark.example",
  role: "ADMIN",
})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject("preview-qa")
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(new TextEncoder().encode(authSecret));

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: [
    "--font-render-hinting=none",
    "--disable-lcd-text",
    "--force-color-profile=srgb",
    "--hide-scrollbars",
  ],
});

function baselinePath(route, viewport) {
  return join(baselineDir, `${route.name}-${viewport.width}x${viewport.height}.png`);
}

async function compareImages(actual, expected) {
  const actualImage = await sharp(actual).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const expectedImage = await sharp(expected).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (
    actualImage.info.width !== expectedImage.info.width ||
    actualImage.info.height !== expectedImage.info.height
  ) {
    return {
      diffPixels: Infinity,
      ratio: 1,
      width: actualImage.info.width,
      height: actualImage.info.height,
      expectedWidth: expectedImage.info.width,
      expectedHeight: expectedImage.info.height,
    };
  }

  let diffPixels = 0;
  const actualData = actualImage.data;
  const expectedData = expectedImage.data;
  for (let index = 0; index < actualData.length; index += 4) {
    const red = Math.abs(actualData[index] - expectedData[index]);
    const green = Math.abs(actualData[index + 1] - expectedData[index + 1]);
    const blue = Math.abs(actualData[index + 2] - expectedData[index + 2]);
    const alpha = Math.abs(actualData[index + 3] - expectedData[index + 3]);
    if (Math.max(red, green, blue, alpha) > pixelThreshold) diffPixels++;
  }

  const pixels = actualImage.info.width * actualImage.info.height;
  return {
    diffPixels,
    ratio: diffPixels / pixels,
    width: actualImage.info.width,
    height: actualImage.info.height,
  };
}

try {
  await mkdir(outputDir, { recursive: true });
  if (update) await mkdir(baselineDir, { recursive: true });

  const failures = [];
  for (const viewport of viewports) {
    for (const route of routes) {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        colorScheme: "light",
        reducedMotion: "reduce",
        locale: "en-US",
        timezoneId: "UTC",
        hasTouch: false,
        isMobile: false,
      });

      if (route.auth) {
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

      const page = await context.newPage();
      const target = `${origin}${route.path}`;
      await page.goto(target, { waitUntil: "load" });
      await page.locator(route.ready).first().waitFor({ state: "visible" });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
      });
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            caret-color: transparent !important;
            scroll-behavior: auto !important;
          }
          html, body { scrollbar-width: none !important; }
          html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; }
        `,
      });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );

      const name = `${route.name}-${viewport.width}x${viewport.height}`;
      const image = await page.screenshot({
        fullPage: true,
        animations: "disabled",
        caret: "hide",
        scale: "css",
        type: "png",
      });
      await context.close();

      if (update) {
        await writeFile(baselinePath(route, viewport), image);
        console.log(`Updated ${name}.png (${image.length} bytes).`);
        continue;
      }

      const expectedPath = baselinePath(route, viewport);
      if (!existsSync(expectedPath)) {
        failures.push(`${name}: missing baseline ${expectedPath}`);
        continue;
      }

      const result = await compareImages(image, await readFile(expectedPath));
      if (result.ratio > maxDiffRatio) {
        const actualPath = join(outputDir, `${name}-actual.png`);
        await writeFile(actualPath, image);
        failures.push(
          `${name}: ${result.diffPixels} pixels differ (${(result.ratio * 100).toFixed(4)}% > ${(maxDiffRatio * 100).toFixed(4)}%); actual: ${actualPath}`,
        );
      } else {
        console.log(
          `PASS ${name}: ${result.width}x${result.height}, ${result.diffPixels} pixels differ.`,
        );
      }
    }
  }

  if (update) {
    console.log(`Updated ${routes.length * viewports.length} visual baselines in ${baselineDir}.`);
  } else if (failures.length > 0) {
    console.error("FAIL: Hub UI visual regression detected.");
    for (const failure of failures) console.error("  - " + failure);
    process.exit(1);
  } else {
    console.log(
      `PASS: ${routes.length * viewports.length} Hub visuals match their baselines.`,
    );
  }
} finally {
  await browser.close();
}
