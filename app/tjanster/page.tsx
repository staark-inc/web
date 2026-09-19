import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Search,
  Smartphone,
  Zap,
  Server,
  Wrench,
  Check,
} from "lucide-react";

import { StandaloneLayout } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "Tjänster | Webbdesign, SEO & Webbutveckling",
  description:
    "Webbdesign, webbutveckling, SEO, prestanda och support för företag i Jönköping, Värnamo och Småland. Upptäck Staark Inc:s tjänster.",

  alternates: {
    canonical: "/tjanster",
  },

  openGraph: {
    title: "Webbtjänster | Staark Inc.",
    description:
      "Webbdesign, SEO och webbutveckling för företag som vill växa online.",
    url: "/tjanster",
    type: "website",
  },
};

const services = [
  {
    slug: "webbdesign",
    icon: Smartphone,
    title: "Webbdesign",
    description:
      "Modern och responsiv design som representerar ditt företag och fungerar på alla skärmstorlekar.",
    features: [
      "Modern design",
      "Mobilanpassning",
      "Tydlig användarupplevelse",
    ],
  },

  {
    slug: "webbutveckling",
    icon: Code2,
    title: "Webbutveckling",
    description:
      "Snabba och moderna webbplatser byggda med teknik anpassad efter ditt företags behov.",
    features: [
      "Modern teknik",
      "Snabb laddning",
      "Skalbara lösningar",
    ],
  },

  {
    slug: "seo",
    icon: Search,
    title: "SEO",
    description:
      "Vi bygger webbplatser med en teknisk grund som hjälper sökmotorer att förstå och hitta ditt innehåll.",
    features: [
      "Teknisk SEO",
      "Lokal SEO",
      "SEO-vänlig struktur",
    ],
  },

  {
    slug: "prestanda",
    icon: Zap,
    title: "Prestanda",
    description:
      "Vi optimerar webbplatsen för snabb laddning och en bättre upplevelse för dina besökare.",
    features: [
      "Prestandaoptimering",
      "Bildoptimering",
      "Core Web Vitals",
    ],
  },

  {
    slug: "webbhotell",
    icon: Server,
    title: "Webbhotell",
    description:
      "En stabil teknisk miljö för din webbplats med fokus på prestanda och tillgänglighet.",
    features: [
      "SSL",
      "Drift",
      "Teknisk hantering",
    ],
  },

  {
    slug: "support-underhall",
    icon: Wrench,
    title: "Support & underhåll",
    description:
      "Vi hjälper dig även efter lanseringen med uppdateringar, förbättringar och teknisk support.",
    features: [
      "Uppdateringar",
      "Support",
      "Löpande förbättringar",
    ],
  },
];

export default function TjansterPage() {
  return (
    <div className="v2-page">
      <StandaloneLayout>

        {/* HERO */}
        <section className="v2-hero">
          <div className="v2-hero-copy">

            <span className="v2-pill">
              VÅRA TJÄNSTER
            </span>

            <h1>
              Allt du behöver för en bättre närvaro online.
            </h1>

            <p>
              Från idé och design till utveckling, SEO och support.
              Vi hjälper företag att bygga snabba och moderna
              webbplatser som är enkla att använda.
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


        {/* SERVICES */}
        <section className="v2-section v2-services">

          <div className="v2-section-header centered">

            <span>
              VAD VI GÖR
            </span>

            <h2>
              Digitala lösningar för ditt företag.
            </h2>

            <p>
              Du behöver inte kombinera flera olika leverantörer.
              Vi kan hjälpa dig genom hela processen från första
              idé till färdig webbplats.
            </p>

          </div>


          <div className="v2-service-grid">

            {services.map((service) => {

              const Icon = service.icon;

              return (
                <article
                  key={service.slug}
                  className="v2-service-card"
                >

                  {/* ICON */}
                  <div className="v2-icon">
                    <Icon
                      size={24}
                      className="text-[var(--v2-blue)]"
                    />
                  </div>


                  {/* TITLE */}
                  <h3>
                    {service.title}
                  </h3>


                  {/* DESCRIPTION */}
                  <p>
                    {service.description}
                  </p>


                  {/* FEATURES */}
                  <ul className="service-feature-list">

                    {service.features.map((feature) => (
                      <li key={feature}>

                        <Check
                          size={16}
                          className="text-[var(--v2-blue)]"
                        />

                        {feature}

                      </li>
                    ))}

                  </ul>


                  {/* LINK TO SERVICE PAGE */}
                  <Link
                    href={`/tjanster/${service.slug}`}
                    className="v2-text-link flex items-center gap-2"
                  >
                    Läs mer
                    <ArrowRight size={15} />
                  </Link>

                </article>
              );
            })}

          </div>

        </section>


        {/* PROCESS */}
        <section className="v2-section v2-portfolio">

          <div className="v2-section-header centered">

            <span>
              FRÅN IDÉ TILL LANSERING
            </span>

            <h2>
              En enkel process.
            </h2>

            <p>
              Vi håller processen tydlig så att du alltid vet
              vad nästa steg är.
            </p>

          </div>


          <div className="v2-process-grid">

            <article>
              <strong>01</strong>

              <h3>
                Behov & mål
              </h3>

              <p>
                Vi börjar med att förstå ditt företag,
                dina kunder och vad webbplatsen ska uppnå.
              </p>
            </article>


            <article>
              <strong>02</strong>

              <h3>
                Design & utveckling
              </h3>

              <p>
                Vi designar och bygger lösningen med fokus
                på användarupplevelse och prestanda.
              </p>
            </article>


            <article>
              <strong>03</strong>

              <h3>
                Lansering & support
              </h3>

              <p>
                När allt är klart lanserar vi webbplatsen
                och kan fortsätta hjälpa dig efteråt.
              </p>
            </article>

          </div>

        </section>


        {/* WHY STAARK */}
        <section className="v2-section">

          <div className="v2-section-header centered">

            <span>
              VARFÖR STAARK?
            </span>

            <h2>
              Webbplatser byggda för verkliga företag.
            </h2>

            <p>
              Vi fokuserar på det som faktiskt spelar roll:
              tydlig design, snabb laddning, mobilanpassning
              och en webbplats som är enkel för dina kunder
              att använda.
            </p>

          </div>

        </section>


        {/* CTA */}
        <section className="v2-section v2-pricing">

          <div className="v2-section-header centered">

            <span>
              NÄSTA STEG
            </span>

            <h2>
              Vad behöver ditt företag?
            </h2>

            <p>
              Berätta lite om ditt projekt så hjälper vi dig
              att hitta rätt lösning.
            </p>


            <div className="v2-actions">

              <Link
                href="/kontakt"
                className="v2-button v2-button-primary"
              >
                Starta ett projekt
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/priser"
                className="v2-button v2-button-light"
              >
                Se våra priser
              </Link>

            </div>

          </div>

        </section>

      </StandaloneLayout>
    </div>
  );
}