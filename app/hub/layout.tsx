import type { Metadata } from "next";
import "./hub.css";

export const metadata: Metadata = {
  title: "Staark Hub",
  description: "Staark Inc. internal workspace",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HubLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}