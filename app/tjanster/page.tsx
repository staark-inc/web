import type { Metadata } from "next";
import Link from "next/link";

import {
  ArrowRight,
  Check,
  Code2,
  Search,
  Server,
  Smartphone,
  Wrench,
  Zap,
} from "lucide-react";

import { StandaloneLayout } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "Tjänster | Webbdesign, SEO & Webbutveckling",

  description:
    "Webbdesign, webbutveckling, SEO, prestanda, webbhotell och support för företag i Jönköping, Värnamo och Småland.",

  alternates: {
    canonical: "/tjanster",
  },

  openGraph: {
    title:
      "Webbdesign, SEO & Webbutveckling | Staark Inc.",

    description:
      "Digitala lösningar för företag som vill ha en snabbare, tydligare och bättre webbplats.",

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
      "Modern och mobilanpassad design skapad för ditt företag och dina kunder.",

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
      "Snabba och moderna webbplatser byggda med teknik som kan växa med ditt företag.",

    features: [
      "Modern teknik",
      "Snabb laddning",
      "Skalbara lösningar",
    ],
  },

  {
    slug: "seo",

    icon: Search,

    title: "SEO & synlighet",

    description:
      "En stark teknisk grund som hjälper sökmotorer och kunder att hitta ditt företag.",

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
      "Vi optimerar webbplatsen för snabb laddning och en bättre upplevelse på alla enheter.",

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
      "Stabil och säker drift för din webbplats med fokus på prestanda och tillgänglighet.",

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

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="v2-hero">
          <div className="v2-hero-copy">

            <span className="v2-pill">
              VÅRA TJÄNSTER
            </span>

            <h1>
              Det ditt företag behöver för en bättre webbplats.
            </h1>

            <p>
              Webbdesign, utveckling, SEO och teknisk drift
              samlat på ett ställe.
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
                href="/priser"
                className="v2-button v2-button-light"
              >
                Se priser
              </Link>

            </div>

          </div>
        </section>


        {/* =====================================================
            QUICK TRUST
        ===================================================== */}

        <section className="v2-proof">

          <div>
            <Check size={20} />

            <span>
              Personlig kontakt
            </span>
          </div>

          <div>
            <Check size={20} />

            <span>
              Mobilanpassat från start
            </span>
          </div>

          <div>
            <Check size={20} />

            <span>
              SEO & prestanda i fokus
            </span>
          </div>

        </section>


        {/* =====================================================
            SERVICES
        ===================================================== */}

        <section className="v2-section v2-services">

          <div className="v2-section-header centered">

            <span>
              VAD VI GÖR
            </span>

            <h2>
              Våra tjänster.
            </h2>

            <p>
              Välj det du behöver eller låt oss hjälpa dig
              sätta ihop rätt lösning för ditt företag.
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

                  <div className="v2-icon">

                    <Icon
                      size={24}
                      className="text-[var(--v2-blue)]"
                    />

                  </div>


                  <h3>
                    {service.title}
                  </h3>


                  <p>
                    {service.description}
                  </p>


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


        {/* =====================================================
            FINAL CTA
        ===================================================== */}

        <section className="v2-section v2-pricing">

          <div className="v2-section-header centered">

            <span>
              NÄSTA STEG
            </span>

            <h2>
              Osäker på vad du behöver?
            </h2>

            <p>
              Berätta kort om ditt företag och vad du vill
              förbättra så hjälper vi dig hitta rätt lösning.
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