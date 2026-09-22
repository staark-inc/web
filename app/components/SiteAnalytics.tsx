"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CONSENT_CHANGE_EVENT, getStoredConsent } from "@/lib/consent";

type SiteAnalyticsProps = { gaId: string };

export default function SiteAnalytics({ gaId }: SiteAnalyticsProps) {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(getStoredConsent()?.analytics === true);
    sync();
    window.addEventListener(CONSENT_CHANGE_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, sync);
  }, []);

  if (
    pathname === "/hub" || pathname.startsWith("/hub/") ||
    pathname === "/offert" || pathname.startsWith("/offert/") ||
    !enabled
  ) return null;

  return <GoogleAnalytics gaId={gaId} />;
}
