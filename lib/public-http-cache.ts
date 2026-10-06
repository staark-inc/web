export const PUBLIC_HTML_CACHE_CONTROL = "public, max-age=0, s-maxage=31536000, must-revalidate";
export const PUBLIC_HTML_VARY = "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding";

// The build timestamp describes this deployed HTML representation, rather
// than inventing an ETag or reusing content sitemap dates across deployments.
export function publicHtmlCacheHeaders(buildTime: string, now = new Date()) {
  return {
    "Cache-Control": PUBLIC_HTML_CACHE_CONTROL,
    "Last-Modified": buildTime,
    Expires: now.toUTCString(),
    Vary: PUBLIC_HTML_VARY,
  };
}

export function canReturnNotModified(request: Request, buildTime: string) {
  if (!["GET", "HEAD"].includes(request.method)) return false;
  if (request.headers.has("if-none-match")) return false; // ETag has precedence.
  if (request.headers.has("rsc") || request.headers.has("next-router-prefetch") || request.headers.has("next-router-state-tree")) return false;
  const modifiedSince = request.headers.get("if-modified-since");
  if (!modifiedSince) return false;
  const requestedDate = Date.parse(modifiedSince);
  const representationDate = Date.parse(buildTime);
  return Number.isFinite(requestedDate) && Number.isFinite(representationDate) && representationDate <= requestedDate;
}
