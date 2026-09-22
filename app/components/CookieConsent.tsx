"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Check, Settings2, ShieldCheck, X } from "lucide-react";
import {
  getStoredConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
  rejectAnalytics,
  saveConsent,
  setGoogleConsentDefaults,
  updateGoogleConsent,
} from "@/lib/consent";

export default function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  const excluded =
    pathname === "/hub" || pathname.startsWith("/hub/") ||
    pathname === "/offert" || pathname.startsWith("/offert/");

  useEffect(() => {
    setGoogleConsentDefaults();
    const stored = getStoredConsent();
    if (stored) {
      setAnalytics(stored.analytics);
      updateGoogleConsent(stored.analytics);
    } else {
      setVisible(true);
    }

    const open = () => {
      setAnalytics(getStoredConsent()?.analytics ?? false);
      setCustomizing(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  useEffect(() => {
    if (excluded) {
      // If a visitor navigates from the public site to a private offer URL,
      // deny analytics even if the Google tag was already loaded earlier.
      updateGoogleConsent(false);
      setVisible(false);
      return;
    }

    const stored = getStoredConsent();
    updateGoogleConsent(stored?.analytics === true);
    if (!stored) setVisible(true);
  }, [excluded]);

  if (excluded || !visible) return null;

  const acceptAll = () => {
    saveConsent(true);
    setAnalytics(true);
    setVisible(false);
  };
  const rejectAll = () => {
    rejectAnalytics();
    setAnalytics(false);
    setVisible(false);
  };
  const saveSelection = () => {
    analytics ? saveConsent(true) : rejectAnalytics();
    setVisible(false);
  };

  return (
    <div className="cookie-consent-backdrop">
      <section className="cookie-consent" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title">
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
