"use client";

import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      className="site-footer-legal-button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
    >
      Cookie-inställningar
    </button>
  );
}
