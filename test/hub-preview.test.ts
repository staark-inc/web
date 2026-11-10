import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const previewRoot = "app/hub/(preview)/design-preview";
const read = (path: string) => readFileSync(join(root, path), "utf8");

function walk(path: string): string[] {
  const absolute = join(root, path);
  return readdirSync(absolute).flatMap((name) => {
    const relative = join(path, name).replaceAll("\\", "/");
    return statSync(join(root, relative)).isDirectory() ? walk(relative) : [relative];
  });
}

const previewSource = walk(previewRoot).filter((file) => /\.(tsx?|css)$/.test(file));

test("preview route is admin-only and noindex", () => {
  const layout = read(previewRoot + "/layout.tsx");
  assert.match(layout, /import \{ getSession \} from "@\/lib\/auth"/);
  assert.match(layout, /session\.role !== "ADMIN"/);
  assert.match(layout, /redirect\("\/hub\/login"\)/);
  assert.match(layout, /robots:\s*\{[\s\S]*index:\s*false/);
  assert.match(layout, /follow:\s*false/);

  const page = read(previewRoot + "/page.tsx");
  assert.match(page, /searchParams/);
  assert.match(page, /isPreviewSection/);
});

test("preview contains no database, API, Server Action or external data access", () => {
  for (const file of previewSource.filter((source) => source.endsWith(".tsx") || source.endsWith(".ts"))) {
    const text = read(file);
    assert.doesNotMatch(text, /@\/(?:lib\/prisma|lib\/saas|app\/api)/, "Forbidden server import in " + file);
    assert.doesNotMatch(
      text,
      /from\s+["'](?:stripe|nodemailer|server-only)["']/,
      "Business dependency in " + file,
    );
    assert.doesNotMatch(text, /\b(?:prisma|stripe|nodemailer)\./, "Business call in " + file);
    assert.doesNotMatch(text, /["']use server["']/, "Server Action in " + file);
    assert.doesNotMatch(text, /\b(?:fetch|axios)\s*\(/, "External request in " + file);
    if (file.endsWith("layout.tsx")) {
      assert.match(text, /@\/lib\/auth/, "Only the auth guard may read server context");
    } else {
      assert.doesNotMatch(text, /@\/lib\//, "Preview content must stay client/local in " + file);
    }
  }
});

test("preview does not leak into production navigation", () => {
  for (const file of [
    "app/hub/(dashboard)/HubNav.tsx",
    "app/hub/(dashboard)/HubSidebar.tsx",
    "app/hub/(dashboard)/layout.tsx",
  ]) {
    assert.doesNotMatch(read(file), /design-preview/, "Production navigation references the preview: " + file);
  }
});

test("preview uses scoped CSS Modules, canonical tokens and approved breakpoints", () => {
  const css = read(previewRoot + "/preview.module.css");
  assert.doesNotMatch(css, /!important/);
  assert.doesNotMatch(css, /:global/);
  assert.doesNotMatch(css, /^\s*\.(?:hub|sw)-/m);
  assert.match(css, /var\(--sw-/);
  assert.doesNotMatch(
    css,
    /(?<![A-Za-z0-9_-])(?:--)?[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*-v[0-9]+(?=-|[^A-Za-z0-9_-]|$)/,
  );
  for (const match of css.matchAll(/font-size\s*:\s*([0-9.]+)px/g)) {
    assert.ok(Number(match[1]) >= 12, "Preview contains operational text below 12px");
  }
  for (const match of css.matchAll(/@media\s*\(([^)]+)\)/g)) {
    const condition = match[1].trim();
    if (/^(?:max|min)-width\s*:/.test(condition)) {
      assert.match(condition, /(?:480|768|1024|1280)px/, "Preview uses an unapproved breakpoint");
    }
  }
  assert.doesNotMatch(
    previewSource.filter((file) => file.endsWith(".tsx")).map(read).join("\n"),
    /className="(?:hub|sw)-/,
  );
});

test("preview has all six sections and deterministic visual baselines", () => {
  for (const section of [
    "DashboardSection",
    "CollectionSection",
    "DetailSection",
    "FormsSection",
    "SettingsSection",
    "ShellSection",
  ]) {
    assert.ok(
      previewSource.includes(previewRoot + "/sections/" + section + ".tsx"),
      "Missing preview section " + section,
    );
  }

  const baselines = walk("test/visual/hub").filter((file) => file.includes("preview-"));
  assert.equal(baselines.length, 30, "Expected six preview sections at five widths");
  for (const section of ["dashboard", "collection", "detail", "forms", "settings", "shell"]) {
    for (const viewport of ["320x568", "390x844", "768x900", "1024x768", "1440x900"]) {
      assert.ok(
        baselines.includes(`test/visual/hub/preview-${section}-${viewport}.png`),
        `Missing preview baseline preview-${section}-${viewport}.png`,
      );
    }
  }
});

test("preview scripts are wired into package commands", () => {
  const packageJson = JSON.parse(read("package.json"));
  assert.equal(packageJson.scripts["check:hub-preview"], "node scripts/check-hub-preview.mjs");
  assert.equal(
    packageJson.scripts["test:hub-preview"],
    "node --experimental-strip-types --test test/hub-preview.test.ts",
  );
});
