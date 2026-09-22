import Link from "next/link";
import { Code2 } from "lucide-react";
import ClientSiteHeader from "./SiteHeader";
import CookieSettingsButton from "./CookieSettingsButton";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "brand brand-compact" : "brand"}>
      <span className="brand-mark"><Code2 size={compact ? 14 : 18} /></span>
      <strong>Staark Inc{compact ? "." : ""}</strong>
    </div>
  );
}

export function SiteHeader() {
  return <ClientSiteHeader />;
}

export function SiteFooter() {
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-about"><Link href="/"><Brand compact /></Link><p>Vi skapar rena och snabba webbplatser för lokala företag i Jönköping och Värnamo, med modern teknik där det verkligen gör skillnad.</p></div>
        <div className="footer-links">
          <div><strong>Tjänster</strong><Link href="/tjanster/webbdesign">Webbdesign</Link><Link href="/tjanster/seo">SEO-optimering</Link><Link href="/tjanster/webbutveckling">Webbutveckling</Link><Link href="/tjanster/support-underhall">Support</Link></div>
          <div><strong>Företaget</strong><Link href="/om-oss">Om oss</Link><Link href="/kontakt">Kontakta oss</Link><Link href="/priser">Priser</Link><Link href="/blog">Blogg</Link></div>
          <div>
            <strong>Sociala medier</strong>

            <a
              href="https://www.linkedin.com/company/staark-inc/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=61594322476318"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div>
          <span>© 2026 Staark Inc. Alla rättigheter förbehållna.</span>

          <div className="site-footer-legal">
            <Link href="/integritetspolicy">Integritetspolicy</Link>
            <Link href="/kakor">Kakor</Link>
            <Link href="/allmanna-villkor">Allmänna villkor</Link>
            <CookieSettingsButton />
          </div>
        </div>

        <span>
          Byggt med: <strong>React • Next.js • Tailwind</strong>
        </span>
      </div>
    </footer>
  );
}

export function StandaloneLayout({ children }: { children: React.ReactNode }) {
  return <main><SiteHeader />{children}<SiteFooter /></main>;
}
