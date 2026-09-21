import type { MetadataRoute } from "next";

import { projects } from "./data/projects";
import { services } from "./data/services";
import { posts } from "./data/posts";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://staarkinc.com";


  
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    {
      route: "/",
      priority: 1,
      changeFrequency: "weekly" as const,
    },
    {
      route: "/tjanster",
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
    {
      route: "/projekt",
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
    {
      route: "/priser",
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
    {
      route: "/om-oss",
      priority: 0.7,
      changeFrequency: "monthly" as const,
    },
    {
      route: "/kontakt",
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
    {
      route: "/support",
      priority: 0.7,
      changeFrequency: "monthly" as const,
    },

    // Lokala landningssidor
    {
      route: "/webbyra-jonkoping",
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
    {
      route: "/webbyra-varnamo",
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
    {
      route: "/webbyra-vaggeryd",
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
    {
      route: "/blog",
      priority: 0.8,
      changeFrequency: "weekly" as const,
    },
  ];

  const staticPages: MetadataRoute.Sitemap =
    staticRoutes.map((page) => ({
      url: new URL(page.route, siteUrl).toString(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }));

  const servicePages: MetadataRoute.Sitemap =
    services.map((service) => ({
      url: new URL(
        `/tjanster/${service.slug}`,
        siteUrl
      ).toString(),
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  const projectPages: MetadataRoute.Sitemap =
    projects.map((project) => ({
      url: new URL(
        `/projekt/${project.slug}`,
        siteUrl
      ).toString(),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  const blogPages: MetadataRoute.Sitemap =
    posts.map((post) => ({
      url: new URL(
        `/blog/${post.slug}`,
        siteUrl
      ).toString(),
      lastModified:
        post.updatedAt || post.publishedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    return [
    ...staticPages,
    ...servicePages,
    ...projectPages,
    ...blogPages,
  ];
}