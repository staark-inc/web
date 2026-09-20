import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  Check,
  Code2,
  Search,
  Smartphone,
  Zap,
} from "lucide-react";

import {
  SiteFooter,
  SiteHeader,
} from "./components/SiteChrome";

import { projects } from "./data/projects";

export const metadata: Metadata = {
  title:
    "Webbyrå i Jönköping & Värnamo",

  description:
    "Staark Inc. bygger moderna, snabba och SEO-optimerade webbplatser för företag i Jönköping, Värnamo och Småland. Webbplatser från 2 999 kr.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title:
      "Webbyrå i Jönköping & Värnamo | Staark Inc.",

    description:
      "Webbdesign, webbutveckling och SEO för företag som vill växa online.",

    url: "/",

    type: "website",
  },
};

/*
 * Only the main services are shown on
 * the homepage.
 *
 * The complete service list lives under
 * /tjanster.
 */

const services = [
  {
    slug: "webbdesign",

    icon: Smartphone,

    title: "Webbdesign",

    description:
      "Modern och mobilanpassad design skapad för ditt företag och dina kunder.",
  },

  {
    slug: "webbutveckling",

    icon: Code2,

    title: "Webbutveckling",

    description:
      "Snabba och moderna webbplatser byggda med teknik som kan växa med företaget.",
  },

  {
    slug: "seo",

    icon: Search,

    title: "SEO & synlighet",

    description:
      "En stark teknisk grund som hjälper rätt kunder att hitta ditt företag.",
  },

  {
    slug: "prestanda",

    icon: Zap,

    title: "Prestanda",

    description:
      "Snabba laddningstider och en bättre upplevelse på mobil och dator.",
  },
];

function SectionHeader({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div
      className={
        centered
          ? "v2-section-header centered"
          : "v2-section-header"
      }
    >
      <span>{eyebrow}</span>

      <h2>{title}</h2>

      {description ? (
        <p>{description}</p>
      ) : null}
    </div>
  );
}

export default function Page() {
  const featuredProject =
    projects[0] ?? null;

  return (
    <main className="v2-page">
      <SiteHeader />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="v2-hero">
        <div className="v2-hero-copy">
          <span className="v2-pill">
            WEBBYRÅ I JÖNKÖPING & VÄRNAMO
          </span>

          <h1>
            Webbplatser som hjälper ditt företag att växa.
          </h1>

          <p>
            Vi designar och utvecklar moderna, snabba
            och SEO-vänliga webbplatser för företag
            som vill synas bättre och få fler kunder.
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
            SEO & prestanda inkluderat
          </span>
        </div>
      </section>

      {/* =====================================================
          FEATURED PROJECT
      ===================================================== */}

      {featuredProject ? (
        <section className="v2-section v2-about">
          <Image
            src={featuredProject.image}
            alt={`${featuredProject.title} – webbprojekt av Staark Inc.`}
            width={720}
            height={520}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          <div>
            <SectionHeader
              eyebrow="UTVALT PROJEKT"
              title={featuredProject.title}
              description={
                featuredProject.description
              }
            />

            <div className="v2-project-tags">
              {featuredProject.tags
                .slice(0, 4)
                .map((tag) => (
                  <span key={tag}>
                    {tag}
                  </span>
                ))}
            </div>

            <Link
              href={`/projekt/${featuredProject.slug}`}
              className="v2-text-link"
            >
              Se hela projektet

              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      ) : null}

      {/* =====================================================
          SERVICES
      ===================================================== */}

      <section className="v2-section v2-services">
        <SectionHeader
          eyebrow="VAD VI GÖR"
          title="Det viktigaste för en bättre webbplats."
          description="Design, utveckling, SEO och prestanda – samlat på ett ställe."
        />

        <div className="v2-service-grid">
          {services.map((service) => {
            const Icon =
              service.icon;

            return (
              <article
                className="v2-service-card"
                key={service.slug}
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

        <div className="home-section-action">
          <Link
            href="/tjanster"
            className="v2-button v2-button-light"
          >
            Alla tjänster

            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* =====================================================
          WHY STAARK
      ===================================================== */}

      <section className="v2-section v2-process">
        <SectionHeader
          eyebrow="VARFÖR STAARK?"
          title="Enklare väg till en bättre webbplats."
          description="Personligt, tydligt och utan onödig komplexitet."
          centered
        />

        <div className="v2-process-grid">
          <article>
            <strong>01</strong>

            <h3>
              Personlig kontakt
            </h3>

            <p>
              Du har direkt kontakt med oss genom hela
              projektet och vet alltid vad som händer.
            </p>
          </article>

          <article>
            <strong>02</strong>

            <h3>
              Byggt för resultat
            </h3>

            <p>
              Design, användarupplevelse, SEO och
              prestanda är en del av lösningen från
              början.
            </p>
          </article>

          <article>
            <strong>03</strong>

            <h3>
              Hjälp även efter lansering
            </h3>

            <p>
              Vi kan fortsätta hjälpa med hosting,
              support, SEO och vidare utveckling.
            </p>
          </article>
        </div>
      </section>

      {/* =====================================================
          PRICE
      ===================================================== */}

      <section className="v2-section v2-pricing">
        <div className="home-price">
          <div className="v2-section-header">
            <span>
              TYDLIGA PRISER
            </span>

            <h2>
              Professionell webbplats från 2 999 kr.
            </h2>

            <p>
              En bra webbplats behöver inte börja med
              en stor investering. Vi anpassar
              lösningen efter vad ditt företag
              faktiskt behöver.
            </p>

            <div
              style={{
                display: "grid",
                gap: "10px",
                marginTop: "24px",
              }}
            >
              <span>
                ✓ Mobilanpassad design
              </span>

              <span>
                ✓ Grundläggande SEO
              </span>

              <span>
                ✓ Kontaktformulär
              </span>

              <span>
                ✓ SSL & modern teknik
              </span>
            </div>
          </div>

          <div className="home-price-card">
            <span>
              FRÅN
            </span>

            <strong>
              2 999
            </strong>

            <small>
              SEK
            </small>

            <p>
              För enklare webbprojekt.
            </p>

            <Link
              href="/priser"
              className="v2-button v2-button-primary"
            >
              Se priser

              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          LOCAL SEO - SMALL / DISCREET
      ===================================================== */}

      <section className="v2-section home-local">
        <SectionHeader
          eyebrow="LOKALT I SMÅLAND"
          title="Vi finns nära ditt företag."
          description="Vi arbetar med företag i Jönköping, Värnamo, Vaggeryd och resten av Småland."
          centered
        />

        <div className="home-local-links">
          <Link href="/webbyra-jonkoping">
            Jönköping
            <ArrowRight size={16} />
          </Link>

          <Link href="/webbyra-varnamo">
            Värnamo
            <ArrowRight size={16} />
          </Link>

          <Link href="/webbyra-vaggeryd">
            Vaggeryd
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section className="v2-section">
        <SectionHeader
          eyebrow="NÄSTA STEG"
          title="Har du ett projekt i tankarna?"
          description="Berätta kort vad du behöver så återkommer vi med ett förslag."
          centered
        />

        <div className="home-section-action">
          <Link
            href="/kontakt"
            className="v2-button v2-button-primary"
          >
            Få kostnadsfri offert

            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}