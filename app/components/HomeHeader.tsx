"use client";

import { Code2, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function HomeHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="v2-navbar">
      <Link className="v2-brand" href="/" aria-label="Staark startsida">
        STAARK<span />
      </Link>
      <button
        className="v2-menu"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-controls="v2-navigation"
        aria-label={menuOpen ? "Stäng meny" : "Öppna meny"}
      >
        {menuOpen ? <X /> : <Menu />}
      </button>
      <nav id="v2-navigation" className={menuOpen ? "v2-nav open" : "v2-nav"}>
        <a href="#services" onClick={closeMenu}>Tjänster</a>
        <a href="#portfolio" onClick={closeMenu}>Portfolio</a>
        <a href="#pricing" onClick={closeMenu}>Priser</a>
        <a href="#about" onClick={closeMenu}>Om Oss</a>
        <a href="#faq" onClick={closeMenu}>FAQ</a>
        <a href="#contact" onClick={closeMenu}>Kontakt</a>
      </nav>
      <a className="v2-button v2-button-primary v2-nav-button" href="#contact">
        Boka samtal
      </a>
    </header>
  );
}

export function HomeBrand() {
  return (
    <Link className="v2-brand" href="/" aria-label="Staark startsida">
      STAARK<span />
    </Link>
  );
}

export function HomeFooter() {
  return (
    <footer className="v2-footer">
      <div className="v2-footer-top">
        <div><HomeBrand /><p>Vi bygger webbplatser som växer ditt företag.</p></div>
        <div className="v2-footer-links">
          <div><strong>Snabblänkar</strong><a href="#services">Tjänster</a><a href="#portfolio">Portfolio</a><a href="#pricing">Priser</a></div>
          <div><strong>Följ oss</strong><a href="#contact">Instagram</a><a href="#contact">Facebook</a><a href="#contact">LinkedIn</a></div>
        </div>
      </div>
      <div className="v2-footer-bottom">
        <span>© 2026 Staark Inc. Alla rättigheter förbehållna.</span>
        <span>Byggt med <Code2 size={15} /> React &amp; Next.js</span>
      </div>
    </footer>
  );
}
