import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  HelpCircle,
} from "lucide-react";

import { StandaloneLayout } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "Priser | Webbdesign & Webbutveckling",
  description:
    "Se våra priser för webbdesign och webbutveckling. Hemsidor från 2 999 kr med tydliga lösningar för små och växande företag.",
  alternates: {
    canonical: "/priser",
  },
  openGraph: {
    title: "Priser | Staark Inc.",
    description:
      "Webbplatser från 2 999 kr. Välj en lösning som passar ditt företag.",
    url: "/priser",
    type: "website",
  },
};

const packages = [
  {
    name: "Starter",
    description:
      "För mindre företag som behöver en enkel och professionell närvaro online.",
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
      "För företag som behöver en mer komplett webbplats med större flexibilitet.",
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
      "För större eller mer avancerade projekt som kräver en skräddarsydd lösning.",
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
    question: "Är 2 999 kr ett fast pris?",
    answer:
      "2 999 kr är vårt startpris för enklare webbprojekt. Det slutliga priset beror på webbplatsens omfattning, funktioner och dina behov.",
  },
  {
    question: "Vad påverkar priset på en webbplats?",
    answer:
      "Antalet sidor, design, specialfunktioner, integrationer, innehåll och projektets omfattning påverkar priset.",
  },
  {
    question: "Kan jag få en offert innan vi börjar?",
    answer:
      "Ja. Berätta vad du behöver så går vi igenom projektet och återkommer med ett förslag innan arbetet börjar.",
  },
  {
    question: "Kan ni hjälpa till efter lanseringen?",
    answer:
      "Ja. Vi erbjuder support, underhåll och fortsatta förbättringar även efter att webbplatsen har lanserats.",
  },
];

export default function PriserPage() {
  return (
    <div className="v2-page">
      <StandaloneLayout>

        {/* HERO */}
        <section className="v2-hero">
          <div className="v2-hero-copy">

            <span className="v2-pill">
              PRISER
            </span>

            <h1>
              En webbplats behöver inte vara komplicerad.
            </h1>

            <p>
              Välj en lösning som passar ditt företag.
              Enklare webbplatser börjar från 2 999 kr och
              större projekt får ett anpassat pris.
            </p>

            <div className="v2-actions">
              <Link
                href="/kontakt"
                className="v2-button v2-button-primary"
              >
                Få kostnadsfri offert
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/projekt"
                className="v2-button v2-button-light"
              >
                Se våra projekt
              </Link>
            </div>

          </div>
        </section>


        {/* PACKAGES */}
        <section className="v2-section v2-pricing">

          <div className="v2-section-header centered">

            <span>
              VÄLJ RÄTT LÖSNING
            </span>

            <h2>
              Tydliga alternativ för olika behov.
            </h2>

            <p>
              Alla företag är olika. Därför kan du börja
              enkelt och bygga vidare när behovet växer.
            </p>

          </div>


          <div className="v2-package-grid">

            {packages.map((pkg) => (
              <article
                key={pkg.name}
                className={`v2-package ${
                  pkg.featured ? "featured" : ""
                }`}
              >

                <div className="v2-package-head">

                  <h3>{pkg.name}</h3>

                  {pkg.featured && (
                    <span>
                      POPULÄR
                    </span>
                  )}

                </div>


                <p className="pricing-description">
                  {pkg.description}
                </p>


                <div className="v2-price">

                  {pkg.priceLabel && (
                    <small>
                      {pkg.priceLabel}
                    </small>
                  )}

                  <strong
                    className={
                      pkg.price === "Begär offert"
                        ? "pricing-quote"
                        : ""
                    }
                  >
                    {pkg.price}
                  </strong>

                  {pkg.suffix && (
                    <small>
                      {pkg.suffix}
                    </small>
                  )}

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


        {/* PRICE INFORMATION */}
        <section className="v2-section">

          <div className="pricing-info">

            <div className="v2-section-header">

              <span>
                BRA ATT VETA
              </span>

              <h2>
                Vad kostar en webbplats?
              </h2>

              <p>
                Priset beror på vad ditt företag behöver.
                En mindre webbplats med några få sidor är
                billigare än en skräddarsydd lösning med
                integrationer och specialfunktioner.
              </p>

              <p>
                Därför går vi igenom projektet tillsammans
                innan arbetet börjar. Du vet vad som ingår
                och vad lösningen kommer att kosta.
              </p>

            </div>


            <div className="pricing-info-card">

              <HelpCircle size={26} />

              <div>
                <strong>
                  Osäker på vilket paket du behöver?
                </strong>

                <p>
                  Det är helt okej. Berätta vad du vill
                  uppnå så hjälper vi dig att hitta en
                  lämplig lösning.
                </p>

                <Link
                  href="/kontakt"
                  className="v2-text-link"
                >
                  Prata med oss
                  <ArrowRight size={15} />
                </Link>
              </div>

            </div>

          </div>

        </section>


        {/* FAQ */}
        <section className="v2-section v2-portfolio">

          <div className="v2-section-header centered">

            <span>
              VANLIGA FRÅGOR
            </span>

            <h2>
              Frågor om priser.
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


        {/* CTA */}
        <section className="v2-section">

          <div className="v2-section-header centered">

            <span>
              KOSTNADSFRI OFFERT
            </span>

            <h2>
              Berätta om ditt nästa projekt.
            </h2>

            <p>
              Vi går igenom dina behov och hjälper dig
              att hitta en lösning som passar ditt företag.
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