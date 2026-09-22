import type { Metadata } from "next";
import { Geist, Unbounded } from "next/font/google";

import SeoJsonLd from "./components/SeoJsonLd";
import SiteAnalytics from "./components/SiteAnalytics";

import {
  absoluteUrl,
  ORGANIZATION_ID,
  SITE_URL,
  WEBSITE_ID,
} from "@/lib/seo";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
});

const gaId =
  process.env.NEXT_PUBLIC_GA_ID ||
  "G-174NDSXWM0";

const googleSiteVerification =
  process.env.GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  applicationName: "Staark Inc.",
  creator: "Staark Inc.",
  publisher: "Staark Inc.",

  title: {
    default:
      "Staark Inc. | Webbyrå i Jönköping och Värnamo",
    template: "%s | Staark Inc.",
  },

  description:
    "Professionella, snabba och prisvärda webbplatser för småföretag i Jönköping, Värnamo och Småland.",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,

  openGraph: {
    title:
      "Staark Inc. | Webbyrå i Jönköping och Värnamo",

    description:
      "Vi bygger webbplatser som hjälper företag att synas bättre och växa online.",

    url: "/",
    siteName: "Staark Inc.",
    locale: "sv_SE",
    type: "website",
  },
};

const globalJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "Staark Inc.",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/android-chrome-512x512.png"),
      },
      email: "contact@staarkinc.com",
      description:
        "Webbyrå som hjälper företag med webbdesign, webbutveckling, SEO, prestanda, hosting och support.",
      areaServed: [
        {
          "@type": "City",
          name: "Jönköping",
        },
        {
          "@type": "City",
          name: "Värnamo",
        },
        {
          "@type": "City",
          name: "Vaggeryd",
        },
        {
          "@type": "AdministrativeArea",
          name: "Småland",
        },
      ],
      knowsAbout: [
        "Webbdesign",
        "Webbutveckling",
        "SEO",
        "Lokal SEO",
        "Webbprestanda",
        "Webbhotell",
      ],
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SITE_URL,
      name: "Staark Inc.",
      inLanguage: "sv-SE",
      publisher: {
        "@id": ORGANIZATION_ID,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${unbounded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SeoJsonLd data={globalJsonLd} />

        {children}

        <SiteAnalytics gaId={gaId} />
      </body>
    </html>
  );
}
