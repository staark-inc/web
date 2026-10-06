import { NextResponse, type NextRequest } from "next/server";
import { posts } from "./app/data/posts";
import { projects } from "./app/data/projects";
import { services } from "./app/data/services";
import { canReturnNotModified, publicHtmlCacheHeaders } from "./lib/public-http-cache";

const staticPublicPages = new Set([
  "/", "/tjanster", "/projekt", "/priser", "/om-oss", "/kontakt", "/support", "/blog",
  "/webbyra-jonkoping", "/webbyra-varnamo", "/webbyra-vaggeryd",
  ...posts.map((post) => `/blog/${post.slug}`),
  ...projects.map((project) => `/projekt/${project.slug}`),
  ...services.map((service) => `/tjanster/${service.slug}`),
]);

const publicImages = new Set([
  "/android-chrome-192x192.png",
  "/avatar-3.png",
  "/favicon-16x16.png",
  "/mission-workshop.png",
  "/logo.png",
  "/apple-touch-icon.png",
  "/avatar-1.png",
  "/icon-check.svg",
  "/avatar-4.png",
  "/icon-help-circle.svg",
  "/avatar-2.png",
  "/android-chrome-512x512.png",
  "/bread-preview.png",
  "/favicon-32x32.png",
  "/icon-search.svg",
  "/icon-layout.svg",
  "/icon-smartphone.svg",
  "/figma-v2/avatar-3.png",
  "/figma-v2/project-1.png",
  "/figma-v2/project-2.png",
  "/figma-v2/avatar-1.png",
  "/figma-v2/avatar-4.png",
  "/figma-v2/about.png",
  "/figma-v2/avatar-2.png",
  "/figma-v2/staark-hub.png",
  "/figma-v2/project-3.png"
]);

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== "production" || !["GET", "HEAD"].includes(request.method)) return NextResponse.next();
  const path = request.nextUrl.pathname;
  // Only files from public/, never private API attachments or uploaded media.
  if (publicImages.has(path)) {
    const response = NextResponse.next();
    response.headers.set("Expires", new Date(Date.now() + 3600000).toUTCString());
    return response;
  }
  const buildTime = process.env.PUBLIC_HTTP_BUILD_TIME;
  if (!staticPublicPages.has(path) || !buildTime || request.headers.has("rsc") || request.headers.has("next-router-state-tree") || request.headers.has("next-router-prefetch")) return NextResponse.next();
  const headers = publicHtmlCacheHeaders(buildTime);
  if (canReturnNotModified(request, buildTime)) return new NextResponse(null, { status: 304, headers });
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
  return response;
}

export const config = {
  matcher: ["/((?!api/|hub/|offert/|_next/).*)"],
};
