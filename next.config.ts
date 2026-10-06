import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

// Keep public pages statically rendered. Next's inline hydration scripts and
// existing inline styles require unsafe-inline; this is a baseline CSP, not a
// nonce-based XSS policy. Never allow unsafe-eval outside development.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.cloudflareinsights.com${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://cloudflareinsights.com${isDevelopment ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "frame-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",

  deploymentId: process.env.DEPLOYMENT_VERSION || undefined,

  allowedDevOrigins: ["192.168.0.10", "dev.staarkinc.com"],

  poweredByHeader: false,

  compress: true,

  generateEtags: true,

  async redirects() {
    return [
      {
        source: "/services",
        destination: "/tjanster",
        permanent: true,
      },
      {
        source: "/pricing",
        destination: "/priser",
        permanent: true,
      },
      {
        source: "/about",
        destination: "/om-oss",
        permanent: true,
      },
      {
        source: "/contact",
        destination: "/kontakt",
        permanent: true,
      },
      {
        source: "/projects",
        destination: "/projekt",
        permanent: true,
      },

      // Pagini vechi care acum sunt secțiuni / nu mai sunt folosite
      {
        source: "/process",
        destination: "/",
        permanent: true,
      },
      {
        source: "/faq",
        destination: "/",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // HSTS is ignored over HTTP, so local LAN testing remains possible.
          ...(!isDevelopment ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
        ],
      },
      ...["/hub/:path*", "/offert/:path*", "/saas/setup/:path*", "/saas/checkout/:path*"].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      })),
      {
        source: "/figma-v2/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },

      {
        source: "/:path*(svg|ico|webp|avif|png|jpg|jpeg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
