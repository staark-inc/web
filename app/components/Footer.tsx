import Link from "next/link";
import { Code2, Mail, MapPin } from "lucide-react";

const serviceLinks = [
  {
    label: "Webbdesign",
    href: "/tjanster/webbdesign",
  },
  {
    label: "Webbutveckling",
    href: "/tjanster/webbutveckling",
  },
  {
    label: "SEO",
    href: "/tjanster/seo",
  },
  {
    label: "Prestanda",
    href: "/tjanster/prestanda",
  },
  {
    label: "Webbhotell",
    href: "/tjanster/webbhotell",
  },
  {
    label: "Support & underhåll",
    href: "/tjanster/support-underhall",
  },
];

const companyLinks = [
  {
    label: "Om oss",
    href: "/om-oss",
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
    label: "Kontakta oss",
    href: "/kontakt",
  },
  {
    label: "Kundsupport",
    href: "/support",
  },
];

const localLinks = [
  {
    label: "Webbyrå Jönköping",
    href: "/webbyra-jonkoping",
  },
  {
    label: "Webbyrå Värnamo",
    href: "/webbyra-varnamo",
  },
  {
    label: "Webbyrå Vaggeryd",
    href: "/webbyra-vaggeryd",
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">

      <div className="site-footer-main">

        {/* BRAND */}
        <div className="site-footer-brand">

          <Link
            href="/"
            className="site-footer-logo"
            aria-label="Staark Inc. startsida"
          >
            <span className="site-footer-logo-icon">
              <Code2 size={17} />
            </span>

            <strong>
              Staark Inc.
            </strong>
          </Link>

          <p>
            Vi skapar moderna, snabba och professionella
            webbplatser för företag i Jönköping, Värnamo
            och Småland.
          </p>

          <div className="site-footer-contact">

            <a href="mailto:contact@staarkinc.com">
              <Mail size={15} />
              contact@staarkinc.com
            </a>

            <span>
              <MapPin size={15} />
              Småland, Sverige
            </span>

          </div>

        </div>


        {/* LINKS */}
        <div className="site-footer-links">

          <div className="site-footer-column">

            <strong>
              Tjänster
            </strong>

            {serviceLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}

          </div>


          <div className="site-footer-column">

            <strong>
              Företaget
            </strong>

            {companyLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}

          </div>


          <div className="site-footer-column">

            <strong>
              Lokalt
            </strong>

            {localLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}

          </div>

        </div>

      </div>


      <div className="site-footer-divider" />


      {/* BOTTOM */}
      <div className="site-footer-bottom">

        <span>
          © 2026 Staark Inc. Alla rättigheter förbehållna.
        </span>

        <div>
          <span>
            Byggt med
          </span>

          <strong>
            React · Next.js · Tailwind
          </strong>
        </div>

      </div>

    </footer>
  );
}