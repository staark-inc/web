"use client";

// Ask again when introducing marketing; a previous statistics choice is not Ads consent.
export const CONSENT_STORAGE_KEY = "staark_cookie_consent_v2";
export const CONSENT_VERSION = 2;
export const CONSENT_CHANGE_EVENT = "staark:consent-change";
export const OPEN_COOKIE_SETTINGS_EVENT = "staark:open-cookie-settings";

export type ConsentState = {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let sessionConsent: ConsentState | null = null;
let sessionOnly = false;
const initializedWindows = new WeakSet<Window>();

export function getStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  if (sessionOnly) return sessionConsent;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return sessionConsent;
  }
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ConsentState> | null;
    if (
      !value || value.version !== CONSENT_VERSION ||
      value.necessary !== true ||
      typeof value.analytics !== "boolean" ||
      typeof value.marketing !== "boolean" ||
      typeof value.updatedAt !== "string"
    ) return null;
    return value as ConsentState;
  } catch {
    return null;
  }
}

export function subscribeConsent(callback: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function setGoogleConsentDefaults() {
  if (typeof window === "undefined" || initializedWindows.has(window)) return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    // gtag consumes Arguments objects, not an array made with rest parameters.
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  }
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("set", "ads_data_redaction", true);
  window.gtag("set", "allow_ad_personalization_signals", false);
  initializedWindows.add(window);
}

export function updateGoogleConsent(analytics: boolean, marketing: boolean) {
  if (typeof window === "undefined") return;
  setGoogleConsentDefaults();
  window.gtag?.("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: marketing ? "granted" : "denied",
    ad_user_data: marketing ? "granted" : "denied",
    // This integration measures enquiries; it does not enable personalized ads.
    ad_personalization: "denied",
  });
}

function deleteMeasurementCookies(analytics: boolean, marketing: boolean) {
  if (typeof document === "undefined") return;
  const names = document.cookie.split(";").map((item) => item.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name) && (
      (!analytics && (name === "_ga" || name.startsWith("_ga_"))) ||
      (!marketing && name.startsWith("_gcl_"))
    ));
  const host = window.location.hostname;
  const rootDomain = host.replace(/^www\./, "");
  for (const name of names) {
    for (const domain of ["", `; domain=${host}`, `; domain=.${rootDomain}`]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain}; SameSite=Lax`;
    }
  }
}

export function saveConsent(analytics: boolean, marketing: boolean) {
  if (typeof window === "undefined") return;
  const state: ConsentState = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics,
    marketing,
    updatedAt: new Date().toISOString(),
  };
  sessionConsent = state;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
    sessionOnly = false;
  } catch {
    // A blocked storage API must not trap the visitor in the consent dialog.
    sessionOnly = true;
  }
  updateGoogleConsent(analytics, marketing);
  deleteMeasurementCookies(analytics, marketing);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: state }));
}
