"use client";

import { Code2, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function HomeHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-navbar">
      <Link className="site-brand" href="/" aria-label="Staark startsida">
        STAARK<span />
      </Link>
      <button
        className="site-menu"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        aria-label={menuOpen ? "Stäng meny" : "Öppna meny"}
      >
        {menuOpen ? <X /> : <Menu />}
      </button>
      <nav id="site-navigation" className={menuOpen ? "site-nav open" : "site-nav"}>
        <Link href="/tjanster" onClick={closeMenu}>Tjänster</Link>
        <Link href="/projekt" onClick={closeMenu}>Portfolio</Link>
        <Link href="/priser" onClick={closeMenu}>Priser</Link>
        <Link href="/om-oss" onClick={closeMenu}>Om Oss</Link>
        <Link href="/support" onClick={closeMenu}>Support</Link>
        <Link href="/blog" onClick={closeMenu}>Blogg</Link>
        <Link href="/kontakt" onClick={closeMenu}>Kontakt</Link>
      </nav>
      <Link className="site-button site-button-primary site-nav-button" href="/kontakt">
        Boka samtal
      </Link>
    </header>
  );
}

export function HomeBrand() {
  return (
    <Link className="site-brand" href="/" aria-label="Staark startsida">
      STAARK<span />
    </Link>
  );
}

export function HomeFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <div><HomeBrand /><p>Vi bygger webbplatser som växer ditt företag.</p></div>
        <div className="site-footer-links">
          <div><strong>Snabblänkar</strong><Link href="/tjanster">Tjänster</Link><Link href="/projekt">Portfolio</Link><Link href="/priser">Priser</Link></div>
          <div><strong>Följ oss</strong><a href="https://www.facebook.com/profile.php?id=61594322476318">Facebook</a><a href="https://www.linkedin.com/company/staark-inc/">LinkedIn</a></div>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© 2026 Staark Inc. Alla rättigheter förbehållna.</span>
        <span>Byggt med <Code2 size={15} /> React &amp; Next.js</span>
      </div>
    </footer>
  );
}
