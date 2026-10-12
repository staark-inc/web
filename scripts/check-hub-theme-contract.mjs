#!/usr/bin/env node
/**
 * PR #103: reject newly added version-numbered selectors and CSS variables
 * while allowing pre-existing legacy names during the Hub UI migration.
 */
import { execFileSync } from "node:child_process";

const baseRef =
  process.env.HUB_THEME_BASE_REF ||
  "origin/" + (process.env.GITHUB_BASE_REF || "dev");

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

let diff;
try {
  git(["rev-parse", "--verify", baseRef + "^{commit}"]);
  diff = git([
    "diff", "--no-ext-diff", "--unified=0", "--diff-filter=ACMR",
    baseRef + "...HEAD", "--", "app/hub", "components/hub",
  ]);
} catch {
  console.error("Cannot compare Hub styles against " + baseRef + ". Fetch base or set HUB_THEME_BASE_REF.");
  process.exit(1);
}

const versionedIdentifier =
  /(?<![A-Za-z0-9_-])(?:--)?[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*-v[0-9]+(?=-|[^A-Za-z0-9_-]|$)/g;
const versionedFilename = /-v[0-9]+(?:\.|\/|$)/;
const offenders = [];
let file = "";

for (const line of diff.split("\n")) {
  if (line.startsWith("+++ b/")) {
    file = line.slice(6);
    // Existing legacy filenames may be edited during migration.
    // This guard only rejects new versioned selectors in added lines.
    continue;
  }

  if (!line.startsWith("+") || line.startsWith("+++")) continue;
  for (const match of line.slice(1).matchAll(versionedIdentifier)) {
    offenders.push(file + ": " + match[0]);
  }
}

if (offenders.length > 0) {
  console.error("New numbered Hub style names are forbidden. Use sw-* primitives and stable hub-* shell classes.");
  for (const offender of [...new Set(offenders)]) {
    console.error("  - " + offender);
  }
  process.exit(1);
}

console.log("PASS: No new versioned Hub selectors, variables or stylesheet filenames.");
