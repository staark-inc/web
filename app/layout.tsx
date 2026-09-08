import type { Metadata } from "next";
import { Geist, Geist_Mono, Schibsted_Grotesk, Unbounded } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://staarkinc.com"),
  title: {
    default: "Staark Inc. | Webbyrå i Jönköping och Värnamo",
    template: "%s | Staark Inc.",
  },
  description: "Professionella, snabba och prisvärda webbplatser för småföretag i Jönköping, Värnamo och Småland.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Staark Inc. | Webbyrå i Jönköping och Värnamo",
    description: "Vi bygger webbplatser som växer ditt företag.",
    url: "/",
    siteName: "Staark Inc.",
    locale: "sv_SE",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} ${schibsted.variable} ${unbounded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
