import type { Metadata } from "next";
import "./hub.css";
import "./overview-command-center.css";
import "./offer-project-link.css";
import "./project-demo-management.css";
import "./project-detail-polish.css";
import "./project-wordpress.css";
import "./projects-v2.css";
import "./client-workspace-polish.css";
import "./contacts-workspace.css";
import "./leads-workspace-polish.css";
import "./lead-controls-compact.css";
import "./operations-workspace.css";
import "./billing-support-v2.css";
import "./settings-v2.css";
import "./profile-v2.css";
import "./notifications-v1.css";
import "./notification-preferences.css";
import "./prospects-vars.css";
import "./prospects-v1.css";
import "./prospects-import.css";
import "./prospects-pagination.css";
import "./prospects-filters.css";
import "./prospects-design-v2.css";
import "./prospects-v3.css";
import "./prospects-more-compact.css";
import "./prospects-buttons-compact.css";
import "./prospects-top10.css";
import "./opportunities.css";
import "./mail-workspace-v2.css";
import "./thread-v2.css";
import "./smoke-sidebar-fixes.css";

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
