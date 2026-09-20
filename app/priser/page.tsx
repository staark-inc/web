import type { Metadata } from "next";
import Link from "next/link";

import {
  ArrowRight,
  Check,
} from "lucide-react";

import { StandaloneLayout } from "../components/SiteChrome";

export const metadata: Metadata = {
  title:
    "Priser | Webbdesign & Webbutveckling",

  description:
    "Webbplatser från 2 999 kr. Se våra lösningar för webbdesign, webbutveckling, SEO och skräddarsydda digitala projekt.",

  alternates: {
    canonical: "/priser",
  },

  openGraph: {
    title:
      "Priser | Staark Inc.",

    description:
      "Webbplatser från 2 999 kr. Tydliga lösningar för små och växande företag.",

    url: "/priser",

    type: "website",
  },
};

const packages = [
  {
    name: "Starter",

    description:
      "För mindre företag som behöver en enkel och professionell webbplats.",

    price: "2 999",

    priceLabel: "från",

    suffix: "kr",

    featured: false,

    features: [
      "Modern webbdesign",
      "Mobilanpassad",
      "Upp till 3 sidor",
      "Kontaktformulär",
      "Grundläggande SEO",
      "SSL",
    ],
  },

  {
    name: "Business",

    description:
      "För företag som behöver en mer komplett webbplats och större flexibilitet.",

    price: "Begär offert",

    priceLabel: "",

    suffix: "",

    featured: true,

    features: [
      "Allt i Starter",
      "Fler undersidor",
      "Anpassad design",
      "Lokal SEO",
      "Prestandaoptimering",
      "Integrationer",
      "Support efter lansering",
    ],
  },

  {
    name: "Custom",

    description:
      "För avancerade projekt, system och skräddarsydda digitala lösningar.",

    price: "Begär offert",

    priceLabel: "",

    suffix: "",

    featured: false,

    features: [
      "Skräddarsydd lösning",
      "Avancerad utveckling",
      "API & integrationer",
      "Specialfunktioner",
      "Prestandaoptimering",
      "Teknisk rådgivning",
      "Löpande support",
    ],
  },
];

const faq = [
  {
    question:
      "Är 2 999 kr ett fast pris?",

    answer:
      "2 999 kr är vårt startpris för enklare webbprojekt. Det slutliga priset beror på omfattning, innehåll och funktioner.",
  },

  {
    question:
      "Vad påverkar priset?",

    answer:
      "Antalet sidor, design, integrationer, specialfunktioner och projektets omfattning påverkar det slutliga priset.",
  },

  {
    question:
      "Får jag ett pris innan arbetet börjar?",

    answer:
      "Ja. Vi går igenom dina behov och skickar ett tydligt förslag innan projektet startar.",
  },

  {
    question:
      "Kan ni hjälpa till efter lanseringen?",

    answer:
      "Ja. Vi erbjuder support, underhåll, hosting och vidareutveckling även efter lanseringen.",
  },
];

export default function PriserPage() {
  return (
    <div className="v2-page">

      <StandaloneLayout>

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="v2-hero">

          <div className="v2-hero-copy">

            <span className="v2-pill">
              PRISER
            </span>

            <h1>
              Tydliga priser utan onödig komplexitet.
            </h1>

            <p>
              Enklare webbplatser börjar från 2 999 kr.
              Större och mer avancerade projekt får ett
              anpassat pris.
            </p>

            <div className="v2-actions">

              <Link
                href="/kontakt"
                className="v2-button v2-button-primary"
              >
                Få kostnadsfri offert

                <ArrowRight size={18} />
              </Link>

            </div>

          </div>

        </section>


        {/* =====================================================
            PACKAGES
        ===================================================== */}

        <section className="v2-section v2-pricing">

          <div className="v2-section-header centered">

            <span>
              VÄLJ RÄTT LÖSNING
            </span>

            <h2>
              En lösning för varje behov.
            </h2>

            <p>
              Börja enkelt eller välj en mer avancerad
              lösning när företaget behöver mer.
            </p>

          </div>


          <div className="v2-package-grid">

            {packages.map((pkg) => (

              <article
                key={pkg.name}
                className={`v2-package ${
                  pkg.featured
                    ? "featured"
                    : ""
                }`}
              >

                <div className="v2-package-head">

                  <h3>
                    {pkg.name}
                  </h3>


                  {pkg.featured ? (
                    <span>
                      REKOMMENDERAD
                    </span>
                  ) : null}

                </div>


                <p className="pricing-description">
                  {pkg.description}
                </p>


                <div className="v2-price">

                  {pkg.priceLabel ? (
                    <small>
                      {pkg.priceLabel}
                    </small>
                  ) : null}


                  <strong
                    className={
                      pkg.price === "Begär offert"
                        ? "pricing-quote"
                        : ""
                    }
                  >
                    {pkg.price}
                  </strong>


                  {pkg.suffix ? (
                    <small>
                      {pkg.suffix}
                    </small>
                  ) : null}

                </div>


                <hr />


                <ul>

                  {pkg.features.map((feature) => (

                    <li key={feature}>

                      <Check
                        size={18}
                        className="text-[var(--v2-blue)]"
                      />

                      <span>
                        {feature}
                      </span>

                    </li>

                  ))}

                </ul>


                <Link
                  href="/kontakt"
                  className={
                    pkg.featured
                      ? "v2-button v2-button-primary"
                      : "v2-button v2-button-outline"
                  }
                >
                  {pkg.price === "Begär offert"
                    ? "Begär offert"
                    : "Kom igång"}

                  <ArrowRight size={17} />
                </Link>

              </article>

            ))}

          </div>

        </section>


        {/* =====================================================
            FAQ
        ===================================================== */}

        <section className="v2-section">

          <div className="v2-section-header centered">

            <span>
              VANLIGA FRÅGOR
            </span>

            <h2>
              Om priser och projekt.
            </h2>

          </div>


          <div className="pricing-faq">

            {faq.map((item) => (

              <article
                key={item.question}
                className="pricing-faq-item"
              >

                <h3>
                  {item.question}
                </h3>

                <p>
                  {item.answer}
                </p>

              </article>

            ))}

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
        ===================================================== */}

        <section className="v2-section v2-pricing">

          <div className="v2-section-header centered">

            <span>
              NÄSTA STEG
            </span>

            <h2>
              Vill du veta vad ditt projekt kostar?
            </h2>

            <p>
              Berätta kort vad du behöver så återkommer
              vi med ett förslag anpassat efter ditt företag.
            </p>


            <div className="v2-actions">

              <Link
                href="/kontakt"
                className="v2-button v2-button-primary"
              >
                Få kostnadsfri offert

                <ArrowRight size={18} />
              </Link>

            </div>

          </div>

        </section>

      </StandaloneLayout>

    </div>
  );
}