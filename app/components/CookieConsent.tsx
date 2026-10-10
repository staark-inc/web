"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { BarChart3, Check, Megaphone, Settings2, ShieldCheck, X } from "lucide-react";
import {
  getStoredConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
  saveConsent,
  subscribeConsent,
  type ConsentState,
} from "@/lib/consent";
import { isPrivateTrackingPath } from "@/lib/google-tag";

const readConsent = () => JSON.stringify(getStoredConsent());
const serverConsent = () => "null";
const subscribeHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

export default function CookieConsent() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const storedConsent = useSyncExternalStore(subscribeConsent, readConsent, serverConsent);
  const hydrated = useSyncExternalStore(subscribeHydration, clientHydrated, serverHydrated);
  const consent = JSON.parse(storedConsent) as ConsentState | null;
  const dialogRef = useRef<HTMLElement>(null);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const excluded = isPrivateTrackingPath(pathname);

  const visible = hydrated && !excluded && (settingsOpen || consent === null);

  useEffect(() => {
    const open = () => {
      if (excluded) return;
      const current = getStoredConsent();
      setAnalytics(current?.analytics === true);
      setMarketing(current?.marketing === true);
      setCustomizing(true);
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, [excluded]);

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
    saveConsent(true, true);
    setAnalytics(true);
    setMarketing(true);
    setSettingsOpen(false);
  };
  const rejectAll = () => {
    saveConsent(false, false);
    setAnalytics(false);
    setMarketing(false);
    setSettingsOpen(false);
  };
  const saveSelection = () => {
    saveConsent(analytics, marketing);
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
              Nödvändiga funktioner används alltid. Med ditt samtycke använder vi Google Analytics för statistik
              och Google Ads för att mäta om annonser leder till kontaktförfrågningar.
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
              <label className="cookie-consent-option">
                <div><span className="cookie-consent-option-icon"><Megaphone size={17} /></span><div><strong>Marknadsföring</strong><p>Google Ads mäter om våra annonser leder till skickade kontaktförfrågningar. Anpassade annonser är avstängda.</p></div></div>
                <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} aria-label="Tillåt annonsmätning via Google Ads" />
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
