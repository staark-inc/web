"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getStoredConsent, subscribeConsent, updateGoogleConsent } from "@/lib/consent";
import { isPrivateTrackingPath } from "@/lib/google-tag";

const GTM_ID = "GTM-WQM65X9C";
let previouslyLoaded = false;
let reloading = false;

export default function GoogleTagManager() {
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => {
      if (reloading) return;
      const consent = getStoredConsent();
      const allowed = !isPrivateTrackingPath(pathname) &&
        (consent?.analytics === true || consent?.marketing === true);

      if (!allowed) {
        // A loaded GTM container cannot be unloaded by removing its script.
        // Reload to fully discard it after consent is withdrawn or on private routes.
        if (previouslyLoaded) {
          reloading = true;
          window.location.reload();
        }
        return;
      }

      // The site's existing consent module sets denied defaults before applying
      // the saved choices. GTM must not start before that is done.
      updateGoogleConsent(consent?.analytics === true, consent?.marketing === true);

      if (previouslyLoaded || document.getElementById("staark-gtm")) return;
      previouslyLoaded = true;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

      const script = document.createElement("script");
      script.id = "staark-gtm";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
      document.head.appendChild(script);
    };
    sync();
    return subscribeConsent(sync);
  }, [pathname]);

  return null;
}
