"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Code2,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  {
    label: "Hem",
    href: "/",
  },
  {
    label: "Tjänster",
    href: "/tjanster",
  },
  {
    label: "Projekt",
    href: "/projekt",
  },
  {
    label: "Priser",
    href: "/priser",
  },
  {
    label: "Om oss",
    href: "/om-oss",
  },
];

export default function SiteHeader() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <header className="v2-navbar">

      {/* LOGO */}
      <Link
        href="/"
        className="v2-brand"
        onClick={() => setMenuOpen(false)}
        aria-label="Staark Inc. startsida"
      >
        <Code2 size={23} />

        <strong>
          Staark Inc
        </strong>

        <span />
      </Link>


      {/* DESKTOP + MOBILE NAV */}
      <nav
        className={`v2-nav ${
          menuOpen ? "open" : ""
        }`}
        aria-label="Huvudnavigation"
      >
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive(item.href)
                ? "v2-nav-active"
                : ""
            }
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}

        {/* only useful inside mobile menu */}
        <Link
          href="/kontakt"
          className="v2-mobile-contact"
          onClick={() => setMenuOpen(false)}
        >
          Få offert
          <ArrowRight size={16} />
        </Link>
      </nav>


      {/* DESKTOP CTA */}
      <Link
        href="/kontakt"
        className="v2-button v2-button-primary v2-nav-button"
      >
        Få offert
        <ArrowRight size={16} />
      </Link>


      {/* MOBILE MENU */}
      <button
        type="button"
        className="v2-menu"
        onClick={() => setMenuOpen((current) => !current)}
        aria-label={
          menuOpen
            ? "Stäng meny"
            : "Öppna meny"
        }
        aria-expanded={menuOpen}
      >
        {menuOpen ? (
          <X size={24} />
        ) : (
          <Menu size={24} />
        )}
      </button>

    </header>
  );
}