import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  allowedDevOrigins: ["192.168.0.10"],

  poweredByHeader: false,

  compress: true,

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
        source: "/figma-v2/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      {
        source: "/:path*(svg|ico|webp|avif|png|jpg|jpeg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;