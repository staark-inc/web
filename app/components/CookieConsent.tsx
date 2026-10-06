"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { BarChart3, Check, Settings2, ShieldCheck, X } from "lucide-react";
import {
  getStoredConsent,
  CONSENT_CHANGE_EVENT,
  OPEN_COOKIE_SETTINGS_EVENT,
  rejectAnalytics,
  saveConsent,
  setGoogleConsentDefaults,
  updateGoogleConsent,
} from "@/lib/consent";

function subscribeConsent(callback: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
const readConsent = () => getStoredConsent()?.analytics ?? null;
const serverConsent = () => null;
const subscribeHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

export default function CookieConsent() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sessionChoice, setSessionChoice] = useState<boolean | null>(null);
  const storedAnalytics = useSyncExternalStore(subscribeConsent, readConsent, serverConsent);
  const hydrated = useSyncExternalStore(subscribeHydration, clientHydrated, serverHydrated);
  const consent = storedAnalytics ?? sessionChoice;
  const dialogRef = useRef<HTMLElement>(null);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  const excluded =
    pathname === "/hub" || pathname.startsWith("/hub/") ||
    pathname === "/offert" || pathname.startsWith("/offert/");

  const visible = hydrated && !excluded && (settingsOpen || consent === null);

  useEffect(() => {
    setGoogleConsentDefaults();
  }, []);

  useEffect(() => {
    updateGoogleConsent(!excluded && consent === true);
  }, [excluded, consent]);

  useEffect(() => {
    const open = () => {
      if (excluded) return;
      setAnalytics(consent === true);
      setCustomizing(true);
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, [excluded, consent]);

  useEffect(() => {
    if (!visible) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.focus();
    const keepFocusInside = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog?.contains(event.target)) dialog?.focus();
    };
    document.addEventListener("focusin", keepFocusInside);
    return () => {
      document.removeEventListener("focusin", keepFocusInside);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [visible]);

  function onDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (consent !== null) setSettingsOpen(false);
      else setCustomizing(false);
      return;
    }
    if (event.key !== "Tab") return;
    const elements = [...(dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]',
    ) ?? [])].filter((element) => element.getClientRects().length > 0);
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
      event.preventDefault(); first.focus();
    }
  }

  if (!visible) return null;

  const acceptAll = () => {
    saveConsent(true);
    setSessionChoice(true);
    setAnalytics(true);
    setSettingsOpen(false);
  };
  const rejectAll = () => {
    rejectAnalytics();
    setSessionChoice(false);
    setAnalytics(false);
    setSettingsOpen(false);
  };
  const saveSelection = () => {
    if (analytics) saveConsent(true);
    else rejectAnalytics();
    setSessionChoice(analytics);
    setSettingsOpen(false);
  };

  return (
    <div className="cookie-consent-backdrop">
      <section ref={dialogRef} tabIndex={-1} onKeyDown={onDialogKeyDown} className="cookie-consent" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title">
        <div className="cookie-consent-heading">
          <span className="cookie-consent-icon"><ShieldCheck size={20} /></span>
          <div>
            <span className="cookie-consent-eyebrow">DIN INTEGRITET</span>
            <h2 id="cookie-consent-title">Vi använder kakor med ditt val.</h2>
          </div>
        </div>

        {!customizing ? (
          <>
            <p className="cookie-consent-copy">
              Nödvändiga funktioner används alltid. Google Analytics används bara om du godkänner statistik.
              Du kan ändra ditt val när som helst via Cookie-inställningar i sidfoten.
            </p>
            <p className="cookie-consent-more">
              Läs mer i vår <Link href="/kakor">information om kakor</Link> och <Link href="/integritetspolicy">integritetspolicy</Link>.
            </p>
            <div className="cookie-consent-actions">
              <button type="button" className="cookie-consent-equal" onClick={acceptAll}><Check size={16} />Acceptera alla</button>
              <button type="button" className="cookie-consent-equal" onClick={rejectAll}><X size={16} />Avvisa alla</button>
              <button type="button" className="cookie-consent-customize" onClick={() => setCustomizing(true)}><Settings2 size={16} />Anpassa</button>
            </div>
          </>
        ) : (
          <>
            <div className="cookie-consent-options">
              <div className="cookie-consent-option">
                <div><span className="cookie-consent-option-icon"><ShieldCheck size={17} /></span><div><strong>Nödvändiga</strong><p>Behövs för grundfunktioner och för att komma ihåg ditt cookie-val.</p></div></div>
                <span className="cookie-consent-required">Alltid aktiv</span>
              </div>
              <label className="cookie-consent-option">
                <div><span className="cookie-consent-option-icon"><BarChart3 size={17} /></span><div><strong>Statistik</strong><p>Google Analytics hjälper oss förstå hur den publika webbplatsen används.</p></div></div>
                <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} aria-label="Tillåt statistik via Google Analytics" />
              </label>
            </div>
            <p className="cookie-consent-more">Du kan när som helst återkalla eller ändra ditt val.</p>
            <div className="cookie-consent-actions">
              <button type="button" className="cookie-consent-equal" onClick={acceptAll}>Acceptera alla</button>
              <button type="button" className="cookie-consent-equal" onClick={rejectAll}>Avvisa alla</button>
              <button type="button" className="cookie-consent-customize" onClick={saveSelection}>Spara val</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
