import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "app/data/sitemap-dates.json");

// Docker builds omit .git. Keep the checked-in dates rather than inventing a
// fresh lastmod on every build. Refresh this file from a full checkout.
if (!existsSync(join(root, ".git"))) {
  if (!existsSync(output)) throw new Error("Missing checked-in sitemap dates");
  console.log("Using checked-in sitemap dates (no Git history available).");
} else {
  const dates = {};
  function walk(directory) {
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!["hub", "api", "offert", "setup", "checkout"].includes(entry.name)) walk(path);
      } else if (entry.name === "page.tsx") {
        const route = `/${dirname(path).replace(/^app\/?/, "")}`;
        // Shared visual/content dependencies can change a page without its
        // route module changing. Blog publication dates are handled separately.
        const date = execFileSync("git", ["log", "-1", "--format=%cI", "--", path, join(dirname(path), "layout.tsx"), "app/layout.tsx", "app/globals.css", "app/legal.css", "app/components", "app/data/projects.ts", "app/data/services.ts", "app/data/posts.ts"], { cwd: root, encoding: "utf8" }).trim();
        if (date) dates[route] = date;
      }
    }
  }
  walk("app");
  writeFileSync(output, `${JSON.stringify(Object.fromEntries(Object.entries(dates).sort()), null, 2)}\n`);
  console.log(`Updated sitemap dates for ${Object.keys(dates).length} route modules.`);
}
