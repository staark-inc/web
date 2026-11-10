#!/usr/bin/env node
/**
 * UI-01 design-system contract.
 *
 * This guard protects the foundation boundary:
 * - canonical tokens/base exist and remain the only global Hub additions;
 * - primitives stay presentation-only and CSS-Module scoped;
 * - no versioned names, !important, tiny text or non-standard breakpoints;
 * - legacy workspace exports and the legacy stylesheet import set stay intact;
 * - no new global page styles are introduced.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const baseRef =
  process.env.HUB_UI_BASE_REF ||
  "origin/" + (process.env.GITHUB_BASE_REF || "dev");

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function filesIn(path) {
  return readdirSync(join(root, path), { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

const errors = [];
const notes = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

const requiredFiles = [
  "app/hub/styles/tokens.css",
  "app/hub/styles/base.css",
  "components/hub/ui/Button.tsx",
  "components/hub/ui/Button.module.css",
  "components/hub/ui/Card.tsx",
  "components/hub/ui/Card.module.css",
  "components/hub/ui/PageHeader.tsx",
  "components/hub/ui/PageHeader.module.css",
  "components/hub/ui/Metrics.tsx",
  "components/hub/ui/Metrics.module.css",
  "components/hub/ui/StatusBadge.tsx",
  "components/hub/ui/StatusBadge.module.css",
  "components/hub/ui/EmptyState.tsx",
  "components/hub/ui/EmptyState.module.css",
  "components/hub/ui/Tabs.tsx",
  "components/hub/ui/Tabs.module.css",
  "components/hub/ui/index.ts",
];

for (const file of requiredFiles) {
  check(existsSync(join(root, file)), "Missing foundation file: " + file);
}

const tokens = read("app/hub/styles/tokens.css");
const requiredTokens = [
  "--sw-font-sans",
  "--sw-text-xs",
  "--sw-text-base",
  "--sw-text-4xl",
  "--sw-bg",
  "--sw-surface",
  "--sw-ink",
  "--sw-muted",
  "--sw-line",
  "--sw-accent",
  "--sw-accent-soft",
  "--sw-sidebar-bg",
  "--sw-focus-color",
  "--sw-focus-ring",
  "--sw-space-4",
  "--sw-radius-md",
  "--sw-shadow-subtle",
  "--sw-sidebar-width",
  "--sw-content-wide",
  "--sw-duration-normal",
  "--sw-breakpoint-md",
];

for (const token of requiredTokens) {
  check(tokens.includes(token + ":"), "Token is not defined: " + token);
}

const moduleFiles = filesIn("components/hub/ui").filter((file) => file.endsWith(".module.css"));
check(moduleFiles.length === 7, "Expected 7 primitive CSS Modules, found " + moduleFiles.length);

const allowedMediaWidths = new Set(["480", "768", "1024", "1280"]);
const versionedIdentifier =
  /(?<![A-Za-z0-9_-])(?:--)?[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*-v[0-9]+(?=-|[^A-Za-z0-9_-]|$)/g;

function auditStylesheet(relativePath, { module }) {
  const text = read(relativePath);
  check(!text.includes("!important"), "!important is forbidden in " + relativePath);
  check(!/font-size\s*:\s*(?:[0-9.]+px|0\.[0-9]+rem)/i.test(text) || ![...text.matchAll(/font-size\s*:\s*([0-9.]+)px/gi)].some((match) => Number(match[1]) < 12), "Text below 12px is forbidden in " + relativePath);
  check(!/font-size\s*:\s*0\.[0-9]+rem/i.test(text), "Sub-12px rem text is forbidden in " + relativePath);
  check(!versionedIdentifier.test(text), "Versioned selector/variable in " + relativePath);
  versionedIdentifier.lastIndex = 0;

  if (module) {
    check(!text.includes(":global"), "CSS Module must not use :global in " + relativePath);
    check(!/^\s*\.(?:hub|sw)-/m.test(text), "CSS Module must use local class names in " + relativePath);
    check(/var\(--sw-/.test(text), "CSS Module must consume canonical tokens in " + relativePath);
  }

  for (const match of text.matchAll(/@media\s*\(([^)]+)\)/g)) {
    const condition = match[1].trim();
    if (/^(?:max|min)-width\s*:/.test(condition)) {
      const width = condition.match(/(\d+)px/)?.[1] || "";
      check(allowedMediaWidths.has(width), "Unapproved media width in " + relativePath + ": " + condition);
    } else if (!/^prefers-reduced-motion\s*:/.test(condition) && !/^pointer\s*:/.test(condition)) {
      check(false, "Unapproved media condition in " + relativePath + ": " + condition);
    }
  }
}

auditStylesheet("app/hub/styles/tokens.css", { module: false });
auditStylesheet("app/hub/styles/base.css", { module: false });
for (const file of moduleFiles) {
  auditStylesheet("components/hub/ui/" + file, { module: true });
}

const componentFiles = filesIn("components/hub/ui").filter((file) => file.endsWith(".tsx"));
for (const file of componentFiles) {
  const relativePath = "components/hub/ui/" + file;
  const text = read(relativePath);
  check(text.includes('data-sw-ui=""'), "Primitive root must opt into the scoped base layer: " + relativePath);
  check(!/@\/(?:lib|app)\//.test(text), "Primitive must not import app or lib code: " + relativePath);
  check(!/\b(?:prisma|stripe|nodemailer|server-only)\b/.test(text), "Primitive must stay presentation-only: " + relativePath);
}

const index = read("components/hub/ui/index.ts");
for (const name of [
  "ActionLink",
  "Button",
  "Card",
  "PageHeader",
  "Metrics",
  "Metric",
  "StatusBadge",
  "EmptyState",
  "Tabs",
]) {
  check(new RegExp("\\b" + name + "\\b").test(index), "Missing primitive export: " + name);
}

const workspace = read("components/hub/workspace.tsx");
const exported = new Set(
  [...workspace.matchAll(/export\s+(?:function|const)\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]),
);
const compatibilityExports = [
  "WorkspacePage",
  "PageHeader",
  "Metrics",
  "Metric",
  "Panel",
  "ActionLink",
  "SectionHeader",
  "RecordList",
  "RecordRow",
  "StatusBadge",
  "InfoChip",
  "EmptyState",
  "BoardCard",
  "ExpandableCard",
  "ListCard",
  "ListCardHeader",
  "ListCardFacts",
  "ListCardFact",
  "ListCardFooter",
  "CardHeader",
  "CardTop",
  "CardSummary",
  "CardBody",
  "CardFooter",
  "CardActions",
  "CardIcon",
  "HubForm",
  "HubFormField",
  "HubFormActions",
];
for (const name of compatibilityExports) {
  check(exported.has(name), "Compatibility export was removed from workspace.tsx: " + name);
}

const tabs = read("components/hub/WorkspaceTabs.tsx");
check(tabs.includes('className="sw-filter-tabs"'), "WorkspaceTabs DOM marker changed");
check(tabs.includes('aria-current={active ? "page" : undefined}'), "WorkspaceTabs aria-current behavior changed");
check(tabs.includes("<Link"), "WorkspaceTabs navigation links changed");

const layout = read("app/hub/layout.tsx");
const legacyStylesheets = [
  "hub.css",
  "offer-project-link.css",
  "project-demo-management.css",
  "project-detail-polish.css",
  "project-wordpress.css",
  "client-workspace-polish.css",
  "contacts-workspace.css",
  "leads-workspace-polish.css",
  "lead-controls-compact.css",
  "operations-workspace.css",
  "updates-workspace.css",
  "billing-support-v2.css",
  "saas-subscriptions.css",
  "saas-workspace.css",
  "saas-subscription-detail.css",
  "support-wordpress.css",
  "settings-v2.css",
  "profile-v2.css",
  "notifications.css",
  "notification-preferences.css",
  "prospects.css",
  "opportunities.css",
  "mail-workspace-v2.css",
  "thread-v2.css",
  "workspace.css",
  "workspace-shell-v3.css",
  "hub-chrome.css",
  "crm-workspace-v7.css",
  "theme.css",
];
check(layout.includes('import "./styles/tokens.css";'), "Hub layout must import canonical tokens");
check(layout.includes('import "./styles/base.css";'), "Hub layout must import the scoped base layer");
for (const file of legacyStylesheets) {
  check(layout.includes('import "./' + file + '";'), "Legacy stylesheet import removed during UI-01: " + file);
}

const importedLegacy = [...layout.matchAll(/import\s+"\.\/([^"/]+\.css)";/g)].map((match) => match[1]);
check(
  importedLegacy.length === legacyStylesheets.length,
  "UI-01 must not add or remove legacy global stylesheets",
);

let diff = "";
try {
  git(["rev-parse", "--verify", baseRef + "^{commit}"]);
  diff = git([
    "diff",
    "--no-ext-diff",
    "--unified=0",
    "--diff-filter=ACMR",
    baseRef + "...HEAD",
    "--",
    "app/hub",
    "components/hub",
  ]);
} catch {
  errors.push("Cannot compare Hub changes against " + baseRef + ". Fetch the base or set HUB_UI_BASE_REF.");
}

for (const line of diff.split("\n")) {
  if (!line.startsWith("+") || line.startsWith("+++")) continue;
  const value = line.slice(1);
  check(!versionedIdentifier.test(value), "New versioned Hub style/name: " + value.trim());
  versionedIdentifier.lastIndex = 0;
}

const globalHubStyles = filesIn("app/hub")
  .filter((file) => file.endsWith(".css"))
  .map((file) => "app/hub/" + file);
check(globalHubStyles.length === 33, "Unexpected Hub global stylesheet count: " + globalHubStyles.length);
notes.push("Legacy Hub stylesheets remain untouched: " + globalHubStyles.length);
notes.push("Canonical primitives: " + componentFiles.length + " components, " + moduleFiles.length + " CSS Modules");
notes.push("Compatibility facade exports: " + compatibilityExports.length);

if (errors.length > 0) {
  console.error("FAIL: Hub UI foundation contract violations.");
  for (const error of [...new Set(errors)]) console.error("  - " + error);
  process.exit(1);
}

for (const note of notes) console.log("  " + note);
console.log("PASS: Hub UI foundation contract is valid.");
