import type { Metadata } from "next";

import "./offer.css";

export const metadata: Metadata = {
  title: "Offert",
  description: "Offert från Staark Inc.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function OfferLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
