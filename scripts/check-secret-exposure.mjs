import {
  readdir,
  readFile,
} from "node:fs/promises";
import {
  extname,
  join,
  relative,
} from "node:path";

const root = process.cwd();
const staticDir = join(root, ".next", "static");
const publicDir = join(root, "public");
const textExtensions = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".html",
  ".json",
  ".map",
  ".txt",
  ".xml",
  ".svg",
]);

const sensitiveEnvNames = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_TEST_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_TEST_WEBHOOK_SECRET",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "GOOGLE_GMAIL_CLIENT_SECRET",
  "SMTP_PASSWORD",
  "SMTP_PASS",
  "WORDPRESS_CONNECTOR_SECRET",
  "DEMO_MANAGER_SECRET",
  "REALTIME_PUBLISH_SECRET",
];

const patterns = [
  {
    name: "PostgreSQL connection URL",
    expression: /postgres(?:ql)?:\/\/[^\s"'`<>]+/i,
  },
  {
    name: "Stripe live secret key",
    expression: /sk_live_[A-Za-z0-9]{10,}/,
  },
  {
    name: "Stripe test secret key",
    expression: /sk_test_[A-Za-z0-9]{10,}/,
  },
  {
    name: "GitHub token",
    expression: /gh[pousr]_[A-Za-z0-9]{20,}/,
  },
  {
    name: "Google API key",
    expression: /AIza[0-9A-Za-z_-]{30,}/,
  },
  {
    name: "Private key block",
    expression:
      /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },
  {
    name: "JWT secret assignment",
    expression:
      /(?:AUTH_SECRET|JWT_SECRET)\s*[:=]\s*["'][^"']{8,}["']/,
  },
];

async function filesUnder(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true,
  }).catch(() => []);

  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesUnder(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function isTextFile(path) {
  return textExtensions.has(extname(path).toLowerCase());
}

async function scanBundle() {
  const files = await filesUnder(staticDir);
  const findings = [];

  for (const path of files) {
    if (!isTextFile(path)) continue;

    const text = await readFile(path, "utf8");
    if (text.includes("\u0000")) continue;

    for (const pattern of patterns) {
      const match = text.match(pattern.expression);
      if (match) {
        findings.push({
          file: relative(root, path),
          rule: pattern.name,
          sample: match[0].slice(0, 24),
        });
      }
    }

    for (const name of sensitiveEnvNames) {
      const value = process.env[name]?.trim();
      if (!value || value.length < 8) continue;
      if (text.includes(value)) {
        findings.push({
          file: relative(root, path),
          rule: `Value of ${name}`,
          sample: "[redacted]",
        });
      }
    }

    for (const match of text.matchAll(
      /NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE|KEY)[A-Z0-9_]*/g
    )) {
      findings.push({
        file: relative(root, path),
        rule: "Sensitive NEXT_PUBLIC name",
        sample: match[0].slice(0, 60),
      });
    }
  }

  return { files: files.length, findings };
}

async function scanPublicDirectory() {
  const files = await filesUnder(publicDir);
  const findings = [];

  for (const path of files) {
    const name = relative(publicDir, path).toLowerCase();

    if (
      name.includes(".env") ||
      name.endsWith(".pem") ||
      name.endsWith(".key") ||
      name.endsWith(".p12") ||
      name.endsWith(".pfx") ||
      name.includes("id_rsa")
    ) {
      findings.push({
        file: relative(root, path),
        rule: "Secret-like public file",
        sample: name,
      });
    }
  }

  return { files: files.length, findings };
}

const bundle = await scanBundle();
const publicFiles = await scanPublicDirectory();
const findings = [
  ...bundle.findings,
  ...publicFiles.findings,
];

if (findings.length) {
  console.error(
    `Secret-exposure check failed: ${findings.length} finding(s).`
  );

  for (const finding of findings) {
    console.error(
      `- ${finding.file}: ${finding.rule} (${finding.sample})`
    );
  }

  process.exit(1);
}

console.log(
  `Secret-exposure check passed: scanned ${bundle.files} client bundle files and ${publicFiles.files} public files.`
);
