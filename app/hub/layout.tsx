import type { Metadata } from "next";
import "./hub.css";
import "./overview-command-center.css";
import "./offer-project-link.css";
import "./project-demo-management.css";
import "./project-detail-polish.css";
import "./projects-v2.css";
import "./client-workspace-polish.css";
import "./leads-workspace-polish.css";
import "./operations-workspace.css";
import "./mobile-tabs-polish.css";
import "./mobile-density-fixes.css";

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
