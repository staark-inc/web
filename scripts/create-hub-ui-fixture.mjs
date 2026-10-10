import { copyFile, mkdir } from "node:fs/promises";
// Explicit test setup, never called from build or start. No auth or database overrides.
await mkdir(new URL("../app/hub-ui-fixture/", import.meta.url), { recursive: true });
await copyFile(new URL("../test/fixtures/hub-ui-page.tsx", import.meta.url), new URL("../app/hub-ui-fixture/page.tsx", import.meta.url));
