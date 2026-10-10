"use client";

import { getStoredConsent, updateGoogleConsent } from "./consent.ts";

export const GOOGLE_ADS_ID = "AW-18468720832";
export const GOOGLE_ADS_CONTACT = `${GOOGLE_ADS_ID}/dUsbCJ3tlIIdEMChyeZE`;

type TagState = {
  gaId: string;
  analytics: boolean;
  marketing: boolean;
  reloading: boolean;
  conversions: Set<string>;
};
const tagStates = new WeakMap<Window, TagState>();

export function isPrivateTrackingPath(pathname: string) {
  return ["/hub", "/offert", "/saas/setup", "/saas/checkout"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function syncGoogleTag(gaId: string, pathname: string) {
  if (typeof window === "undefined") return;
  const consent = getStoredConsent();
  const excluded = isPrivateTrackingPath(pathname);
  const analytics = !excluded && consent?.analytics === true;
  const marketing = !excluded && consent?.marketing === true;
  updateGoogleConsent(analytics, marketing);

  let state = tagStates.get(window);
  if (state?.reloading) return;
  if (state && ((state.analytics && !analytics) || (state.marketing && !marketing))) {
    // Removing a script node does not unload gtag. Start a clean document when
    // a loaded destination loses consent (also handles another tab's choice).
    state.reloading = true;
    window.location.reload();
    return;
  }
  if (!analytics && !marketing) return;

  if (!state) {
    state = { gaId, analytics: false, marketing: false, reloading: false, conversions: new Set() };
    tagStates.set(window, state);
    window.gtag?.("js", new Date());
  }
  if (analytics && !state.analytics) {
    // Preserve the existing GA page-view behavior and account-level settings.
    window.gtag?.("config", gaId);
    state.analytics = true;
  }
  if (marketing && !state.marketing) {
    window.gtag?.("config", GOOGLE_ADS_ID, { send_page_view: false });
    state.marketing = true;
  }
  if (!document.getElementById("staark-google-tag")) {
    const script = document.createElement("script");
    script.id = "staark-google-tag";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analytics ? gaId : GOOGLE_ADS_ID)}`;
    document.head.appendChild(script);
  }
}

// The API issues this opaque ID only after the real enquiry has been processed.
// No email, name or message is sent to Google, and honeypot responses have no ID.
export function trackContactConversion(conversionId: unknown) {
  if (typeof window === "undefined" || typeof conversionId !== "string" ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(conversionId) ||
      isPrivateTrackingPath(window.location.pathname)) return;
  const state = tagStates.get(window);
  const consent = getStoredConsent();
  if (!state || state.reloading || state.conversions.has(conversionId)) return;
  // Never replay an earlier enquiry when marketing permission is granted later.
  state.conversions.add(conversionId);
  try {
    if (consent?.analytics && state.analytics) {
      window.gtag?.("event", "generate_lead", {
        send_to: state.gaId,
        lead_source: "contact_form",
      });
    }
    if (consent?.marketing && state.marketing) {
      window.gtag?.("event", "conversion", {
        send_to: GOOGLE_ADS_CONTACT,
        transaction_id: conversionId,
      });
    }
  } catch {
    // Tracking must never turn a successfully sent enquiry into a form error.
  }
}
