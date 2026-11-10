import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) => readFileSync(join(root, path), "utf8");

function walk(path: string): string[] {
  const absolute = join(root, path);
  return readdirSync(absolute).flatMap((name) => {
    const relative = join(path, name).replaceAll("\\", "/");
    return statSync(join(root, relative)).isDirectory() ? walk(relative) : [relative];
  });
}

function token(name: string) {
  const match = read("app/hub/styles/tokens.css").match(
    new RegExp("--" + name + ":\\s*(#[0-9a-fA-F]{6});"),
  );
  assert.ok(match, "Missing hex token --" + name);
  return match[1];
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const modules = [
  "Button",
  "Card",
  "PageHeader",
  "Metrics",
  "StatusBadge",
  "EmptyState",
  "Tabs",
];

test("canonical tokens cover the required foundation values", () => {
  const tokens = read("app/hub/styles/tokens.css");
  for (const name of [
    "sw-font-sans",
    "sw-text-xs",
    "sw-text-4xl",
    "sw-bg",
    "sw-surface",
    "sw-ink",
    "sw-muted",
    "sw-line",
    "sw-accent",
    "sw-accent-soft",
    "sw-sidebar-bg",
    "sw-focus-color",
    "sw-focus-ring",
    "sw-space-4",
    "sw-radius-md",
    "sw-shadow-subtle",
    "sw-sidebar-width",
    "sw-content-wide",
    "sw-duration-normal",
    "sw-breakpoint-md",
  ]) {
    assert.match(tokens, new RegExp("--" + name + ":"), "Missing token --" + name);
  }
  assert.match(tokens, /--sw-text-xs:\s*12px/);
  assert.doesNotMatch(tokens, /--sw-text-[a-z0-9-]+:\s*(?:[0-9]|1[01])px/);
});

test("text and semantic color tokens meet WCAG AA contrast", () => {
  const pairs: Array<[string, string, string]> = [
    ["muted on surface", token("sw-muted"), token("sw-surface")],
    ["muted on canvas", token("sw-muted"), token("sw-bg")],
    ["body on surface", token("sw-body"), token("sw-surface")],
    ["on-accent on accent", token("sw-on-accent"), token("sw-accent")],
    ["success on soft", token("sw-success"), token("sw-success-soft")],
    ["info on soft", token("sw-info"), token("sw-info-soft")],
    ["warning on soft", token("sw-warning"), token("sw-warning-soft")],
    ["danger on soft", token("sw-danger"), token("sw-danger-soft")],
  ];
  for (const [label, foreground, background] of pairs) {
    assert.ok(contrast(foreground, background) >= 4.5, label + " is below 4.5:1");
  }
});

test("primitives are CSS-Module scoped, token-driven and presentation-only", () => {
  for (const name of modules) {
    const tsx = read("components/hub/ui/" + name + ".tsx");
    const css = read("components/hub/ui/" + name + ".module.css");
    assert.match(tsx, /data-sw-ui=""/, name + " must opt into the scoped base layer");
    assert.doesNotMatch(tsx, /@\/(?:lib|app)\//, name + " must not import app or lib code");
    assert.doesNotMatch(tsx, /\b(?:prisma|stripe|nodemailer|server-only)\b/);
    assert.match(css, /var\(--sw-/, name + " must consume canonical tokens");
    assert.doesNotMatch(css, /!important/, name + " must not use !important");
    assert.doesNotMatch(css, /:global/, name + " must not escape CSS Module scope");
    assert.doesNotMatch(css, /^\s*\.(?:hub|sw)-/m, name + " must use local class names");
    for (const match of css.matchAll(/font-size\s*:\s*([0-9.]+)px/g)) {
      assert.ok(Number(match[1]) >= 12, name + " contains text below 12px");
    }
    for (const match of css.matchAll(/@media\s*\(([^)]+)\)/g)) {
      const condition = match[1].trim();
      if (/^(?:max|min)-width\s*:/.test(condition)) {
        assert.match(condition, /(?:480|768|1024|1280)px/, name + " uses an unapproved breakpoint");
      }
    }
  }
});

test("workspace facade and tab navigation remain compatible", () => {
  const workspace = read("components/hub/workspace.tsx");
  for (const name of [
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
  ]) {
    assert.match(
      workspace,
      new RegExp("export\\s+(?:function|const)\\s+" + name + "\\b"),
      "Missing workspace export " + name,
    );
  }

  const tabs = read("components/hub/WorkspaceTabs.tsx");
  assert.match(tabs, /className="sw-filter-tabs"/);
  assert.match(tabs, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(tabs, /<Link/);
});

test("legacy Hub stylesheets stay imported and new primitives stay opt-in", () => {
  const layout = read("app/hub/layout.tsx");
  const legacy = [
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
  assert.match(layout, /import "\.\/styles\/tokens\.css";/);
  assert.match(layout, /import "\.\/styles\/base\.css";/);
  for (const file of legacy) {
    assert.ok(layout.includes('import "./' + file + '";'), "Missing legacy import " + file);
  }
  assert.equal(
    [...layout.matchAll(/import\s+"\.\/([^"/]+\.css)";/g)].length,
    legacy.length,
    "UI-01 must not change the legacy global stylesheet set",
  );

  const productionPages = walk("app/hub").filter((file) => file.endsWith("page.tsx"));
  for (const page of productionPages) {
    assert.doesNotMatch(
      read(page),
      /@\/components\/hub\/ui/,
      "Production page migrated before its template PR: " + page,
    );
  }
});

test("visual baselines cover every foundation route and viewport", () => {
  const baselines = walk("test/visual/hub").filter((file) => file.endsWith(".png"));
  assert.equal(baselines.length, 15, "Expected 15 deterministic visual baselines");
  for (const route of ["foundation", "hub-workspace", "login"]) {
    for (const viewport of ["320x568", "390x844", "768x900", "1024x768", "1440x900"]) {
      assert.ok(
        baselines.includes(`test/visual/hub/${route}-${viewport}.png`),
        `Missing visual baseline ${route}-${viewport}.png`,
      );
    }
  }
});

test("foundation files contain no versioned or patch-specific names", () => {
  const files = [
    "app/hub/styles/tokens.css",
    "app/hub/styles/base.css",
    ...modules.map((name) => "components/hub/ui/" + name + ".module.css"),
    ...modules.map((name) => "components/hub/ui/" + name + ".tsx"),
  ];
  const versioned = /(?<![A-Za-z0-9_-])(?:--)?[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*-v[0-9]+(?=-|[^A-Za-z0-9_-]|$)/;
  for (const file of files) {
    assert.doesNotMatch(read(file), versioned, "Versioned name in " + file);
  }
});
