import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { runBoundaryChecks } from "../scripts/check-server-boundary.mjs";

test("client components never reach Prisma, PostgreSQL or server-only modules", async () => {
  const result = await runBoundaryChecks(process.cwd());

  assert.deepEqual(result.violations, []);
  assert.ok(result.files > 0);
  assert.ok(result.clientFiles > 0);
});

test("every privileged Hub route and server action has an authorization check", async () => {
  const result = await runBoundaryChecks(process.cwd());

  assert.equal(
    result.violations.filter((violation) =>
      violation.type.includes("without-session")
    ).length,
    0
  );
});

test("raw SQL uses the parameterized Prisma APIs", async () => {
  const result = await runBoundaryChecks(process.cwd());

  assert.equal(
    result.violations.filter(
      (violation) =>
        violation.type === "unsafe-raw-sql"
    ).length,
    0
  );
});

test("the Prisma entrypoint is guarded as a server-only module", async () => {
  const source = await readFile(
    "lib/prisma.ts",
    "utf8"
  );

  assert.match(
    source,
    /import\s+["']@\/lib\/server-only["']/
  );
  assert.match(
    source,
    /process\.env\.DATABASE_URL/
  );
  assert.doesNotMatch(
    source,
    /NEXT_PUBLIC_/
  );
});

test("the boundary checker detects a synthetic client-to-Prisma import", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "staark-boundary-")
  );

  try {
    await mkdir(join(directory, "app"), {
      recursive: true,
    });
    await mkdir(join(directory, "lib"), {
      recursive: true,
    });
    await writeFile(
      join(directory, "lib", "prisma.ts"),
      "export const prisma = {};\n"
    );
    await writeFile(
      join(directory, "app", "client.tsx"),
      '"use client";\nimport { prisma } from "@/lib/prisma";\nexport default function Client() { return prisma ? null : null; }\n'
    );

    const result = await runBoundaryChecks(directory);

    assert.ok(
      result.violations.some(
        (violation) =>
          violation.type === "client-db-import"
      )
    );
  } finally {
    await rm(directory, {
      recursive: true,
      force: true,
    });
  }
});
