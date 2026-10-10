"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { subscribeConsent } from "@/lib/consent";
import { syncGoogleTag } from "@/lib/google-tag";

type SiteAnalyticsProps = { gaId: string };

export default function SiteAnalytics({ gaId }: SiteAnalyticsProps) {
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => syncGoogleTag(gaId, pathname);
    sync();
    return subscribeConsent(sync);
  }, [gaId, pathname]);

  return null;
}
