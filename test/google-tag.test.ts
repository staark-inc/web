import assert from "node:assert/strict";
import { test } from "node:test";
import { CONSENT_STORAGE_KEY, getStoredConsent, saveConsent, subscribeConsent } from "../lib/consent.ts";
import { GOOGLE_ADS_CONTACT, GOOGLE_ADS_ID, syncGoogleTag, trackContactConversion } from "../lib/google-tag.ts";

const gaId = "G-TEST";
const conversionId = "2f3c0990-cc64-43e8-b3e3-9d7f516b226c";

function browser() {
  const storage = new Map<string, string>();
  const scripts: { id: string; src: string }[] = [];
  const cookieWrites: string[] = [];
  const events = new EventTarget();
  let reloads = 0;
  const fakeWindow = {
    location: { origin: "https://staarkinc.com", hostname: "staarkinc.com", pathname: "/kontakt", reload: () => reloads++ },
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    dataLayer: [] as unknown[],
  };
  Object.assign(globalThis, {
    window: fakeWindow,
    document: {
      title: "Kontakt",
      get cookie() { return "_ga=test; _ga_TEST=test; _gcl_aw=test; session=keep"; },
      set cookie(value: string) { cookieWrites.push(value); },
      getElementById: (id: string) => scripts.find((script) => script.id === id),
      createElement: () => ({}),
      head: { appendChild: (script: { id: string; src: string }) => scripts.push(script) },
    },
  });
  return {
    storage, scripts, cookieWrites,
    commands: () => fakeWindow.dataLayer.map((value) => Array.from(value as ArrayLike<unknown>)),
    reloads: () => reloads,
  };
}

function conversions(env: ReturnType<typeof browser>) {
  return env.commands().filter((command) => command[0] === "event" && command[1] === "conversion");
}

test("new visitors and old statistics consent never load Google scripts", () => {
  const env = browser();
  env.storage.set("staark_cookie_consent_v1", JSON.stringify({ version: 1, necessary: true, analytics: true, updatedAt: "old" }));
  assert.equal(getStoredConsent(), null);
  syncGoogleTag(gaId, "/kontakt");
  trackContactConversion(conversionId);
  assert.equal(env.scripts.length, 0);
  assert.equal(conversions(env).length, 0);
  assert.equal(env.commands()[0][0], "consent");
  assert.equal(Array.isArray(window.dataLayer![0]), false, "Use the documented gtag Arguments queue");
});

test("statistics consent configures GA only and reports the existing lead event", () => {
  const env = browser();
  saveConsent(true, false);
  syncGoogleTag(gaId, "/kontakt");
  trackContactConversion(conversionId);
  assert.deepEqual(env.commands().filter((c) => c[0] === "config").map((c) => c[1]), [gaId]);
  assert.equal(conversions(env).length, 0);
  assert.equal(env.commands().filter((c) => c[1] === "generate_lead").length, 1);
  assert.equal(env.scripts.length, 1);
});

test("marketing-only consent works without enabling Analytics", () => {
  const env = browser();
  saveConsent(false, true);
  syncGoogleTag(gaId, "/kontakt");
  trackContactConversion(conversionId);
  assert.deepEqual(env.commands().filter((c) => c[0] === "config").map((c) => c[1]), [GOOGLE_ADS_ID]);
  assert.deepEqual(conversions(env), [["event", "conversion", { send_to: GOOGLE_ADS_CONTACT, transaction_id: conversionId }]]);
  assert.equal(env.commands().filter((c) => c[1] === "generate_lead" || c[1] === "page_view").length, 0);
  assert.ok(env.scripts[0].src.endsWith(GOOGLE_ADS_ID));
});

test("both destinations share one loader, initialize once, and deduplicate conversion IDs", () => {
  const env = browser();
  saveConsent(true, true);
  syncGoogleTag(gaId, "/kontakt");
  syncGoogleTag(gaId, "/kontakt");
  syncGoogleTag(gaId, "/priser");
  trackContactConversion(conversionId);
  trackContactConversion(conversionId);
  assert.equal(env.scripts.length, 1);
  assert.equal(env.commands().filter((c) => c[0] === "config").length, 2);
  assert.equal(env.commands().filter((c) => c[1] === "page_view").length, 0, "Do not duplicate GA's automatic page views");
  assert.equal(env.commands().filter((c) => c[0] === "consent" && c[1] === "default").length, 1);
  assert.equal(conversions(env).length, 1);
  assert.equal((env.commands().findLast((c) => c[0] === "consent")![2] as Record<string, string>).ad_personalization, "denied");
});

test("missing or malformed conversion IDs (including honeypot success) send no event", () => {
  const env = browser();
  saveConsent(true, true);
  syncGoogleTag(gaId, "/kontakt");
  for (const value of [undefined, null, "", "test@example.com", {}, 123]) trackContactConversion(value);
  assert.equal(conversions(env).length, 0);
  assert.equal(env.commands().filter((c) => c[1] === "generate_lead").length, 0);
});

test("private pages never initialize either destination or report a conversion", () => {
  for (const path of ["/hub", "/hub/login", "/offert/private-token", "/saas/setup", "/saas/checkout/success"]) {
    const env = browser();
    saveConsent(true, true);
    window.location.pathname = path;
    syncGoogleTag(gaId, path);
    trackContactConversion(conversionId);
    assert.equal(env.scripts.length, 0);
    assert.equal(conversions(env).length, 0);
  }
});

test("revocation removes measurement cookies and reloads an already loaded tag", () => {
  const env = browser();
  saveConsent(true, true);
  syncGoogleTag(gaId, "/kontakt");
  saveConsent(false, false);
  syncGoogleTag(gaId, "/kontakt");
  trackContactConversion(conversionId);
  assert.equal(env.reloads(), 1);
  assert.ok(env.cookieWrites.some((c) => c.startsWith("_gcl_aw=")));
  assert.ok(env.cookieWrites.some((c) => c.startsWith("_ga=")));
  assert.ok(env.cookieWrites.every((c) => !c.startsWith("session=")));
  assert.equal(conversions(env).length, 0);
});

test("adding marketing later initializes only Ads and does not replay earlier leads", () => {
  const env = browser();
  saveConsent(true, false);
  syncGoogleTag(gaId, "/kontakt");
  trackContactConversion(conversionId);
  saveConsent(true, true);
  syncGoogleTag(gaId, "/kontakt");
  trackContactConversion(conversionId);
  assert.equal(conversions(env).length, 0);
  assert.equal(env.scripts.length, 1);
  assert.equal(env.reloads(), 0);
  assert.equal(env.commands().filter((c) => c[0] === "config").length, 2);
});

test("storage events synchronize other tabs and listeners can unsubscribe", () => {
  const env = browser();
  saveConsent(true, true);
  const unsubscribe = subscribeConsent(() => syncGoogleTag(gaId, "/kontakt"));
  syncGoogleTag(gaId, "/kontakt");
  env.storage.set(CONSENT_STORAGE_KEY, JSON.stringify({ ...getStoredConsent(), marketing: false }));
  window.dispatchEvent(new Event("storage"));
  assert.equal(env.reloads(), 1);
  unsubscribe();
});

test("a tracking exception does not break a successful form submission", () => {
  browser();
  saveConsent(true, true);
  syncGoogleTag(gaId, "/kontakt");
  window.gtag = () => { throw new Error("blocked"); };
  assert.doesNotThrow(() => trackContactConversion(conversionId));
});

test("malformed stored consent fails closed even after an earlier grant", () => {
  const env = browser();
  saveConsent(true, true);
  env.storage.set(CONSENT_STORAGE_KEY, "{");
  assert.equal(getStoredConsent(), null);
  syncGoogleTag(gaId, "/kontakt");
  assert.equal(env.scripts.length, 0);
});

test("blocked localStorage still lets the visitor save and reject cookies", () => {
  browser();
  window.localStorage.setItem = () => { throw new Error("blocked"); };
  assert.doesNotThrow(() => saveConsent(false, false));
  assert.equal(getStoredConsent()?.marketing, false);
  assert.equal(getStoredConsent()?.analytics, false);
});
