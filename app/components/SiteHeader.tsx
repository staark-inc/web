"use client";

import { Code2, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "brand brand-compact" : "brand"}><span className="brand-mark"><Code2 size={compact ? 14 : 18} /></span><strong>Staark Inc{compact ? "." : ""}</strong></div>;
}

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="navbar"><Link href="/"><Brand /></Link><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="primary-navigation" aria-label={menuOpen ? "Stäng meny" : "Öppna meny"}>{menuOpen ? <X /> : <Menu />}</button><nav id="primary-navigation" className={menuOpen ? "nav-links open" : "nav-links"}><Link onClick={() => setMenuOpen(false)} href="/services">Tjänster</Link><Link onClick={() => setMenuOpen(false)} href="/process">Hur det fungerar</Link><Link onClick={() => setMenuOpen(false)} href="/about">Om oss</Link><Link onClick={() => setMenuOpen(false)} href="/pricing">Priser</Link><Link onClick={() => setMenuOpen(false)} href="/faq">FAQ</Link></nav><Link className="button button-light nav-cta" href="/contact">Kontakta oss</Link></header>;
}
