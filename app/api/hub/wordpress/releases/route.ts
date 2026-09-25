import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyWordPressRequest } from "@/lib/wordpress-connector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORDPRESS_RELEASE_REPO = "staark-inc/wordpress";
const MANIFEST_ASSET_NAME = "staark-wordpress-manifest.json";
const GITHUB_USER_AGENT = "Staark-Hub-WordPress-Release-Endpoint";

type ReleaseChannel = "stable" | "beta";
type ReleaseKey = "core" | "theme" | "salong" | "bygg" | "gastfrihet";

type GitHubAsset = {
  name?: unknown;
  browser_download_url?: unknown;
};

type GitHubRelease = {
  draft?: unknown;
  prerelease?: unknown;
  tag_name?: unknown;
  published_at?: unknown;
  assets?: unknown;
};

type ReleaseEntry = {
  slug?: string;
  version: string;
  package: string;
  sha256: string;
  signature?: string;
  requires?: {
    wordpress?: string;
    php?: string;
  };
  notes?: string;
};

type ReleaseManifest = {
  schema: 1;
  channel: ReleaseChannel;
  generatedAt: string;
  releases: {
    core?: ReleaseEntry;
    theme?: ReleaseEntry;
    salong?: ReleaseEntry;
    bygg?: ReleaseEntry;
    gastfrihet?: ReleaseEntry;
    gastfrihet?: ReleaseEntry;
  };
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function releaseChannel(request: Request): ReleaseChannel | null {
  const value = new URL(request.url).searchParams.get("channel")?.trim().toLowerCase();

  if (!value || value === "stable") return "stable";
  if (value === "beta") return "beta";
  return null;
}

function hubVersion(request: Request) {
  const value = new URL(request.url).searchParams.get("hub")?.trim() ?? "";
  return /^[0-9A-Za-z.+_-]{1,80}$/.test(value) ? value : "";
}

function manifestOverride(channel: ReleaseChannel) {
  const value =
    channel === "stable"
      ? process.env.STAARK_WORDPRESS_STABLE_MANIFEST_URL
      : process.env.STAARK_WORDPRESS_BETA_MANIFEST_URL;

  return value?.trim() ?? "";
}

function validHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchJson(url: string, revalidate = 300): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": GITHUB_USER_AGENT,
    },
    redirect: "follow",
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function betaManifestUrl() {
  const releases = await fetchJson(
    `https://api.github.com/repos/${WORDPRESS_RELEASE_REPO}/releases?per_page=30`,
    300
  );

  if (!Array.isArray(releases)) return "";

  for (const rawRelease of releases) {
    const release = asRecord(rawRelease) as GitHubRelease | null;
    if (!release || release.draft === true || release.prerelease !== true) continue;

    const assets = Array.isArray(release.assets) ? release.assets : [];
    const asset = assets.find((rawAsset) => {
      const item = asRecord(rawAsset) as GitHubAsset | null;
      return item && text(item.name, 200) === MANIFEST_ASSET_NAME;
    });

    const assetRecord = asRecord(asset) as GitHubAsset | null;
    const url = text(assetRecord?.browser_download_url, 1000);
    if (validHttpsUrl(url)) return url;
  }

  return "";
}

async function manifestUrl(channel: ReleaseChannel) {
  const override = manifestOverride(channel);
  if (override) {
    if (!validHttpsUrl(override)) {
      throw new Error("Configured WordPress manifest URL must use HTTPS.");
    }
    return override;
  }

  if (channel === "stable") {
    return `https://github.com/${WORDPRESS_RELEASE_REPO}/releases/latest/download/${MANIFEST_ASSET_NAME}`;
  }

  return betaManifestUrl();
}

function normalizeRelease(value: unknown, type: ReleaseKey): ReleaseEntry | null {
  const source = asRecord(value);
  if (!source) return null;

  const version = text(source.version, 80);
  const packageUrl = text(source.package, 1000);
  const sha256 = text(source.sha256, 64).toLowerCase();
  const signature = text(source.signature, 512);
  const notes = text(source.notes, 5000);
  const requires = asRecord(source.requires);

  if (
    !version ||
    !validHttpsUrl(packageUrl) ||
    !/^[a-f0-9]{64}$/.test(sha256)
  ) {
    return null;
  }

  const normalized: ReleaseEntry = {
    version,
    package: packageUrl,
    sha256,
  };

  if (type !== "core") {
    const defaultSlugs: Record<Exclude<ReleaseKey, "core">, string> = {
      theme: "staark",
      salong: "staark-salong",
      bygg: "staark-bygg",
      gastfrihet: "staark-gastfrihet",
      gastfrihet: "staark-gastfrihet",
    };

    normalized.slug =
      text(source.slug, 120) ||
      defaultSlugs[type as Exclude<ReleaseKey, "core">];
  }

  if (signature) normalized.signature = signature;
  if (notes) normalized.notes = notes;

  if (requires) {
    const wordpress = text(requires.wordpress, 80);
    const php = text(requires.php, 80);
    if (wordpress || php) {
      normalized.requires = {};
      if (wordpress) normalized.requires.wordpress = wordpress;
      if (php) normalized.requires.php = php;
    }
  }

  return normalized;
}

function normalizeManifest(value: unknown, channel: ReleaseChannel): ReleaseManifest | null {
  const source = asRecord(value);
  if (!source || Number(source.schema) !== 1) return null;

  const manifestChannel = text(source.channel, 20).toLowerCase();
  if (manifestChannel !== channel) return null;

  const releases = asRecord(source.releases);
  if (!releases) return null;

  const core = normalizeRelease(releases.core, "core");
  const theme = normalizeRelease(releases.theme, "theme");
  const salong = normalizeRelease(releases.salong, "salong");
  const bygg = normalizeRelease(releases.bygg, "bygg");
  const gastfrihet = normalizeRelease(releases.gastfrihet, "gastfrihet");

  if (!core && !theme && !salong && !bygg && !gastfrihet) return null;

  const generatedAtValue = text(source.generatedAt, 80);
  const generatedAtDate = new Date(generatedAtValue);
  const generatedAt = Number.isNaN(generatedAtDate.getTime())
    ? new Date().toISOString()
    : generatedAtDate.toISOString();

  return {
    schema: 1,
    channel,
    generatedAt,
    releases: {
      ...(core ? { core } : {}),
      ...(theme ? { theme } : {}),
      ...(salong ? { salong } : {}),
      ...(bygg ? { bygg } : {}),
      ...(gastfrihet ? { gastfrihet } : {}),
      ...(gastfrihet ? { gastfrihet } : {}),
    },
  };
}

export async function GET(request: Request) {
  try {
    const verified = await verifyWordPressRequest(request, "");
    if (!verified.ok) {
      return jsonError(verified.error, verified.status);
    }

    const channel = releaseChannel(request);
    if (!channel) {
      return jsonError("Unsupported WordPress release channel.", 400);
    }

    const url = await manifestUrl(channel);
    if (!url) {
      return jsonError(
        `No ${channel} WordPress release manifest is published yet.`,
        503
      );
    }

    let remoteManifest: unknown;
    try {
      remoteManifest = await fetchJson(url, 300);
    } catch (error) {
      console.error(`[WORDPRESS] Could not fetch ${channel} release manifest:`, error);
      return jsonError(
        `The ${channel} WordPress release manifest is not available yet.`,
        503
      );
    }

    const manifest = normalizeManifest(remoteManifest, channel);
    if (!manifest) {
      return jsonError("The WordPress release manifest is invalid.", 502);
    }

    const installedHubVersion = hubVersion(request);
    const now = new Date();

    await prisma.wordPressSite.update({
      where: { id: verified.site.id },
      data: {
        status: "CONNECTED",
        lastSeenAt: now,
        ...(installedHubVersion ? { hubVersion: installedHubVersion } : {}),
      },
    });

    return NextResponse.json(manifest, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Staark-Release-Channel": channel,
      },
    });
  } catch (error) {
    console.error("[WORDPRESS] Release manifest endpoint failed:", error);
    return jsonError("Could not load the WordPress release channel.", 500);
  }
}
