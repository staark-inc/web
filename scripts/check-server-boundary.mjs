import {
  readdir,
  readFile,
} from "node:fs/promises";
import {
  dirname,
  join,
  relative,
  resolve,
} from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const SOURCE_ROOTS = ["app", "lib"];
const FORBIDDEN_LOCAL_PATHS = new Set([
  "lib/prisma.ts",
  "lib/server-only.ts",
]);
const FORBIDDEN_PACKAGES = new Set([
  "pg",
  "@prisma/client",
  "@prisma/adapter-pg",
]);
const FORBIDDEN_LOCAL_PREFIXES = [
  "generated/prisma/",
];
const AUTH_ALLOWLIST = new Set([
  "app/api/hub/login/route.ts",
  "app/api/hub/logout/route.ts",
  "app/api/hub/integrations/stripe/webhook/route.ts",
  "app/api/hub/wordpress/connect/route.ts",
  "app/api/hub/wordpress/ping/route.ts",
  "app/api/hub/wordpress/releases/route.ts",
  "app/api/hub/wordpress/sync/route.ts",
]);
const SERVER_ACTION_ALLOWLIST = new Set([
  "app/offert/[token]/actions.ts",
]);

function normalize(path) {
  return path.split("\\").join("/");
}

async function filesUnder(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true,
  }).catch(() => []);

  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesUnder(path)));
    } else if (
      entry.isFile() &&
      /\.(?:ts|tsx)$/.test(entry.name)
    ) {
      files.push(path);
    }
  }

  return files;
}

function isClientFile(source) {
  return /^\s*["']use client["'];?/.test(source);
}

function isServerActionFile(source) {
  return /^\s*["']use server["'];?/.test(source);
}

function valueImports(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS
  );

  const imports = [];

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (statement.importClause?.isTypeOnly) continue;

      const clause = statement.importClause;
      const bindings = clause?.namedBindings;

      if (
        bindings &&
        ts.isNamedImports(bindings) &&
        bindings.elements.length > 0 &&
        bindings.elements.every(
          (element) => element.isTypeOnly
        ) &&
        !clause?.name
      ) {
        continue;
      }

      imports.push(statement.moduleSpecifier.getText(sourceFile).slice(1, -1));
      continue;
    }

    if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly) continue;
      if (!statement.moduleSpecifier) continue;

      const clause = statement.exportClause;
      if (
        clause &&
        ts.isNamedExports(clause) &&
        clause.elements.length > 0 &&
        clause.elements.every(
          (element) => element.isTypeOnly
        )
      ) {
        continue;
      }

      imports.push(statement.moduleSpecifier.getText(sourceFile).slice(1, -1));
    }
  }

  return imports;
}

function resolveLocalModule(
  specifier,
  importer,
  root
) {
  let base;

  if (specifier.startsWith("@/")) {
    base = resolve(root, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = resolve(dirname(importer), specifier);
  } else {
    return null;
  }

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.mjs`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];

  for (const candidate of candidates) {
    const relativePath = normalize(
      relative(root, candidate)
    );
    if (
      !relativePath.startsWith("..") &&
      relativePath.length > 0
    ) {
      return candidate;
    }
  }

  return base;
}

function isForbiddenLocal(relativePath) {
  const candidates = [
    relativePath,
    `${relativePath}.ts`,
    `${relativePath}.tsx`,
  ];

  if (
    candidates.includes(
      "generated/prisma/browser.ts"
    ) ||
    candidates.includes("generated/prisma/enums.ts")
  ) {
    return false;
  }

  return (
    candidates.some((candidate) =>
      FORBIDDEN_LOCAL_PATHS.has(candidate)
    ) ||
    FORBIDDEN_LOCAL_PREFIXES.some((prefix) =>
      relativePath.startsWith(prefix)
    )
  );
}

export async function runBoundaryChecks(root) {
  const files = (
    await Promise.all(
      SOURCE_ROOTS.map((directory) =>
        filesUnder(join(root, directory))
      )
    )
  ).flat();

  const sources = new Map();

  for (const file of files) {
    sources.set(file, await readFile(file, "utf8"));
  }

  const violations = [];
  const clientFiles = [...sources.entries()]
    .filter(([, source]) => isClientFile(source));

  for (const [file] of clientFiles) {
    const queue = [{
      file,
      chain: [normalize(relative(root, file))],
    }];
    const visited = new Set([file]);

    while (queue.length > 0) {
      const current = queue.shift();
      const imports = valueImports(
        sources.get(current.file) ?? "",
        current.file
      );

      for (const specifier of imports) {
        if (FORBIDDEN_PACKAGES.has(specifier)) {
          violations.push({
            type: "client-db-import",
            file: normalize(relative(root, current.file)),
            chain: [...current.chain, specifier],
          });
          continue;
        }

        const resolved = resolveLocalModule(
          specifier,
          current.file,
          root
        );

        if (!resolved) continue;

        const relativePath = normalize(
          relative(root, resolved)
        );

        if (isForbiddenLocal(relativePath)) {
          violations.push({
            type: "client-db-import",
            file: normalize(relative(root, current.file)),
            chain: [...current.chain, relativePath],
          });
          continue;
        }

        if (
          sources.has(resolved) &&
          !visited.has(resolved)
        ) {
          visited.add(resolved);
          queue.push({
            file: resolved,
            chain: [...current.chain, relativePath],
          });
        }
      }
    }
  }

  for (const [file, source] of sources) {
    const relativePath = normalize(relative(root, file));

    if (
      relativePath.startsWith("app/api/hub/") &&
      relativePath.endsWith("/route.ts") &&
      !AUTH_ALLOWLIST.has(relativePath) &&
      !source.includes("getSession(")
    ) {
      violations.push({
        type: "hub-route-without-session",
        file: relativePath,
        chain: [relativePath],
      });
    }

    if (
      isServerActionFile(source) &&
      !SERVER_ACTION_ALLOWLIST.has(relativePath) &&
      !source.includes("getSession(")
    ) {
      violations.push({
        type: "server-action-without-session",
        file: relativePath,
        chain: [relativePath],
      });
    }

    if (
      /\$queryRawUnsafe|\$executeRawUnsafe/.test(
        source
      )
    ) {
      violations.push({
        type: "unsafe-raw-sql",
        file: relativePath,
        chain: [relativePath],
      });
    }
  }

  return {
    files: files.length,
    clientFiles: clientFiles.length,
    violations,
  };
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url ===
    pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
  const result = await runBoundaryChecks(
    process.cwd()
  );

  if (result.violations.length > 0) {
    console.error(
      `Server-boundary check failed: ${result.violations.length} violation(s).`
    );

    for (const violation of result.violations) {
      console.error(
        `- ${violation.type}: ${violation.chain.join(" -> ")}`
      );
    }

    process.exit(1);
  }

  console.log(
    `Server-boundary check passed: ${result.files} server/app files, ${result.clientFiles} client files.`
  );
}
