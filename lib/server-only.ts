/**
 * Defense in depth for database/server modules.
 *
 * The static check in `scripts/check-server-boundary.mjs` is the primary
 * build-time guard. This runtime guard catches an accidental client import
 * that bypasses the static graph (for example through a new bundler alias).
 */
if (typeof window !== "undefined") {
  throw new Error(
    "A server-only module was imported into a client component."
  );
}

export {};
