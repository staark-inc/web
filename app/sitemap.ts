import type { MetadataRoute } from "next";

import { posts } from "./data/posts";
import { projects } from "./data/projects";
import { services } from "./data/services";

import { absoluteUrl } from "@/lib/seo";

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
      priority: 0.5,
      changeFrequency: "monthly" as const,
    },
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
      priority: 0.9,
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
      url: absoluteUrl(page.route),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }));

  const servicePages: MetadataRoute.Sitemap =
    services.map((service) => ({
      url: absoluteUrl(`/tjanster/${service.slug}`),
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  const projectPages: MetadataRoute.Sitemap =
    projects.map((project) => ({
      url: absoluteUrl(`/projekt/${project.slug}`),
      changeFrequency: "monthly",
      priority: 0.7,
      images: project.image
        ? [absoluteUrl(project.image)]
        : undefined,
    }));

  const blogPages: MetadataRoute.Sitemap =
    posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified:
        post.updatedAt || post.publishedAt,
      changeFrequency: "monthly",
      priority: 0.7,
      images: post.image
        ? [absoluteUrl(post.image)]
        : undefined,
    }));

  return [
    ...staticPages,
    ...servicePages,
    ...projectPages,
    ...blogPages,
  ];
}
