"use client";

import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";

type SiteAnalyticsProps = {
  gaId: string;
};

export default function SiteAnalytics({
  gaId,
}: SiteAnalyticsProps) {
  const pathname = usePathname();

  // Never track Staark Hub.
  if (
    pathname === "/hub" ||
    pathname.startsWith("/hub/")
  ) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}