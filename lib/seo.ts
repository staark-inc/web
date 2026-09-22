const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://staarkinc.com";

export const SITE_URL = rawSiteUrl.replace(/\/+$/, "");

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function absoluteUrl(path: string) {
  return new URL(path, `${SITE_URL}/`).toString();
}
