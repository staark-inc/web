"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Code2,
  Menu,
  LifeBuoy,
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
    label: "Staark Platform",
    badge: "Nyhet",
    href: "/saas",
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
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const mobile = window.matchMedia("(max-width: 900px)");
    if (mobile.matches) navigationRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const onResize = () => { if (!mobile.matches) setMenuOpen(false); };
    mobile.addEventListener("change", onResize);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      mobile.removeEventListener("change", onResize);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

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
        id="site-navigation"
        ref={navigationRef}
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
            aria-current={isActive(item.href) ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
            {"badge" in item && item.badge ? <span className="v2-nav-new">{item.badge}</span> : null}
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
      <div className="v2-nav-actions">
        <Link
          href="/support"
          className="v2-button v2-button-secondary v2-nav-support"
        >
          <LifeBuoy size={16} />
          Support
        </Link>

        <Link
          href="/kontakt"
          className="v2-button v2-button-primary v2-nav-button"
        >
          Få offert
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* MOBILE MENU */}
      <button
        ref={menuButton}
        type="button"
        className="v2-menu"
        onClick={() => setMenuOpen((current) => !current)}
        aria-label={
          menuOpen
            ? "Stäng meny"
            : "Öppna meny"
        }
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
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
