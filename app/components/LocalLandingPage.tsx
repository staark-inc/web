import Link from "next/link";

import {
  ArrowRight,
  Check,
  Code2,
  Search,
  Smartphone,
  Zap,
} from "lucide-react";

import { StandaloneLayout } from "./SiteChrome";

type Props = {
  city: string;
  title: string;
  description: string;

  localTitle: string;
  localDescription: string;

  localPoints?: string[];
};

const services = [
  {
    slug: "webbdesign",
    icon: Smartphone,
    title: "Webbdesign",
    description:
      "Modern och mobilanpassad design skapad för ditt företag och dina kunder.",
  },

  {
    slug: "seo",
    icon: Search,
    title: "SEO & synlighet",
    description:
      "En teknisk grund som hjälper rätt kunder att hitta ditt företag på Google.",
  },

  {
    slug: "webbutveckling",
    icon: Code2,
    title: "Webbutveckling",
    description:
      "Snabba och moderna lösningar byggda efter företagets behov.",
  },

  {
    slug: "prestanda",
    icon: Zap,
    title: "Prestanda",
    description:
      "Snabba laddningstider och en bättre upplevelse på mobil och dator.",
  },
];

export default function LocalLandingPage({
  city,
  title,
  description,
  localTitle,
  localDescription,
  localPoints = [],
}: Props) {
  return (
    <div className="v2-page">
      <StandaloneLayout>

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="v2-hero">

          <div className="v2-hero-copy">

            <span className="v2-pill">
              WEBBYRÅ I {city.toUpperCase()}
            </span>

            <h1>
              {title}
            </h1>

            <p>
              {description}
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


        {/* =====================================================
            TRUST
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
            LOCAL CONTENT
        ===================================================== */}

        <section className="v2-section">

          <div className="v2-section-header">

            <span>
              WEBBDESIGN I {city.toUpperCase()}
            </span>

            <h2>
              {localTitle}
            </h2>

            <p>
              {localDescription}
            </p>

          </div>


          {localPoints.length > 0 ? (
            <div className="about-principles-list">

              {localPoints.map((point) => (

                <div key={point}>

                  <span>
                    <Check size={17} />
                  </span>

                  <strong>
                    {point}
                  </strong>

                </div>

              ))}

            </div>
          ) : null}

        </section>


        {/* =====================================================
            SERVICES
        ===================================================== */}

        <section className="v2-section v2-services">

          <div className="v2-section-header centered">

            <span>
              VÅRA TJÄNSTER
            </span>

            <h2>
              Digital hjälp för företag i {city}.
            </h2>

            <p>
              Från webbdesign och utveckling till SEO
              och prestanda.
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


                  <Link
                    href={`/tjanster/${service.slug}`}
                    className="v2-text-link"
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
            CTA
        ===================================================== */}

        <section className="v2-section v2-pricing">

          <div className="v2-section-header centered">

            <span>
              NÄSTA STEG
            </span>

            <h2>
              Behöver ditt företag i {city} en bättre webbplats?
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