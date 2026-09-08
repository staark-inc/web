import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://staarkinc.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/services", "/process", "/about", "/pricing", "/faq", "/contact"];

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
