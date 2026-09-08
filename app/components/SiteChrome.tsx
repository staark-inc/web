"use client";

import Link from "next/link";
import { Code2, Menu, X } from "lucide-react";
import { useState } from "react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "brand brand-compact" : "brand"}>
      <span className="brand-mark"><Code2 size={compact ? 14 : 18} /></span>
      <strong>Staark Inc{compact ? "." : ""}</strong>
    </div>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="navbar">
      <Link href="/"><Brand /></Link>
      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Öppna meny">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? "nav-links open" : "nav-links"}>
        <Link onClick={() => setMenuOpen(false)} href="/services">Tjänster</Link>
        <Link onClick={() => setMenuOpen(false)} href="/process">Hur det fungerar</Link>
        <Link onClick={() => setMenuOpen(false)} href="/about">Om oss</Link>
        <Link onClick={() => setMenuOpen(false)} href="/pricing">Priser</Link>
        <Link onClick={() => setMenuOpen(false)} href="/faq">FAQ</Link>
      </nav>
      <Link className="button button-light nav-cta" href="/contact">Kontakta oss</Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-about"><Link href="/"><Brand compact /></Link><p>Vi skapar rena och snabba webbplatser för lokala företag i Jönköping och Värnamo, med modern teknik där det verkligen gör skillnad.</p></div>
        <div className="footer-links">
          <div><strong>Tjänster</strong><Link href="/services">Anpassad Design</Link><Link href="/services">SEO-optimering</Link><Link href="/services">Responsiv Webbplats</Link><Link href="/services">Support</Link></div>
          <div><strong>Team</strong><Link href="/about">Om oss</Link><Link href="/contact">Kontakta oss</Link><Link href="/faq">Vanliga frågor</Link></div>
          <div><strong>Sociala medier</strong><a href="#contact">Facebook</a><a href="#contact">Instagram</a><a href="#contact">LinkedIn</a></div>
        </div>
      </div>
      <div className="footer-bottom"><span>© 2026 Staark Inc. Alla rättigheter förbehållna.</span><span>Byggt med: <strong>React • Next.js • Tailwind</strong></span></div>
    </footer>
  );
}

export function StandaloneLayout({ children }: { children: React.ReactNode }) {
  return <main><SiteHeader />{children}<SiteFooter /></main>;
}
