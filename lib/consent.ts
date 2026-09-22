"use client";

export const CONSENT_STORAGE_KEY = "staark_cookie_consent_v1";
export const CONSENT_VERSION = 1;
export const CONSENT_CHANGE_EVENT = "staark:consent-change";
export const OPEN_COOKIE_SETTINGS_EVENT = "staark:open-cookie-settings";

export type ConsentState = {
  version: number;
  necessary: true;
  analytics: boolean;
  updatedAt: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function getStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ConsentState>;
    if (
      value.version !== CONSENT_VERSION ||
      value.necessary !== true ||
      typeof value.analytics !== "boolean" ||
      typeof value.updatedAt !== "string"
    ) return null;
    return value as ConsentState;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent() {
  return getStoredConsent()?.analytics === true;
}

function ensureGtagQueue() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
  }
}

export function setGoogleConsentDefaults() {
  if (typeof window === "undefined") return;
  ensureGtagQueue();
  window.gtag?.("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
}

export function updateGoogleConsent(analytics: boolean) {
  if (typeof window === "undefined") return;
  ensureGtagQueue();
  window.gtag?.("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function saveConsent(analytics: boolean) {
  if (typeof window === "undefined") return;
  const state: ConsentState = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  updateGoogleConsent(analytics);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: state }));
}

export function deleteAnalyticsCookies() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const names = document.cookie
    .split(";")
    .map((item) => item.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name) && (name === "_ga" || name.startsWith("_ga_")));
  const rootDomain = window.location.hostname.replace(/^www\./, "");
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${rootDomain}; SameSite=Lax`;
  }
}

export function rejectAnalytics() {
  updateGoogleConsent(false);
  deleteAnalyticsCookies();
  saveConsent(false);
}
