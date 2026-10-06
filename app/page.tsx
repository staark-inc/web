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
    "Webbyrå & webbdesign i Jönköping och Värnamo | Staark Inc.",

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
          ? "site-section-header centered"
          : "site-section-header"
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
    <main className="site-page">
      <SiteHeader />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="site-hero">
        <div className="site-hero-copy">
          <span className="site-pill">
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

          <div className="site-actions">
            <Link
              href="/kontakt"
              className="site-button site-button-primary"
            >
              Få kostnadsfri offert

              <ArrowRight size={18} />
            </Link>

            <Link
              href="/projekt"
              className="site-button site-button-light"
            >
              Se våra projekt
            </Link>
          </div>
        </div>
      </section>

      <section className="home-platform-intro" aria-label="Staark Platform">
        <div><span className="home-platform-badge">Nyhet</span><strong>Staark Platform</strong><p>Din webbplats, dina förfrågningar och rätt verktyg för att växa – på ett ställe.</p></div>
        <Link href="/saas">Upptäck plattformen <ArrowRight size={17} /></Link>
      </section>

      {/* =====================================================
          QUICK TRUST
      ===================================================== */}

      <section className="site-proof">
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
        <section className="site-section site-about">
          <Image
            src={featuredProject.image}
            alt={`${featuredProject.title} – webbprojekt av Staark Inc.`}
            width={720}
            height={520}
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

            <div className="site-project-tags">
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
              className="site-text-link"
            >
              Se projektet {featuredProject.title}

              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      ) : null}

      {/* =====================================================
          SERVICES
      ===================================================== */}

      <section className="site-section site-services">
        <SectionHeader
          eyebrow="VAD VI GÖR"
          title="Det viktigaste för en bättre webbplats."
          description="Design, utveckling, SEO och prestanda – samlat på ett ställe."
        />

        <div className="site-service-grid">
          {services.map((service) => {
            const Icon =
              service.icon;

            return (
              <article
                className="site-service-card"
                key={service.slug}
              >
                <div className="site-icon">
                  <Icon
                    size={24}
                    className="text-[var(--site-blue)]"
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
                  className="site-text-link"
                >
                  Läs mer om {service.title.toLowerCase()}

                  <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="home-section-action">
          <Link
            href="/tjanster"
            className="site-button site-button-light"
          >
            Alla tjänster

            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* =====================================================
          WHY STAARK
      ===================================================== */}

      <section className="site-section site-process">
        <SectionHeader
          eyebrow="VARFÖR STAARK?"
          title="Enklare väg till en bättre webbplats."
          description="Personligt, tydligt och utan onödig komplexitet."
          centered
        />

        <div className="site-process-grid">
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

      <section className="site-section site-pricing">
        <div className="home-price">
          <div className="site-section-header">
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
              className="site-button site-button-primary"
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

      <section className="site-section home-local">
        <SectionHeader
          eyebrow="LOKALT I SMÅLAND"
          title="Vi finns nära ditt företag."
          description="Vi arbetar med företag i Jönköping, Värnamo, Vaggeryd och resten av Småland."
          centered
        />

        <div className="home-local-links">
          <Link href="/webbyra-jonkoping">
            <span>
              <strong>Webbyrå i Jönköping</strong>
              <span className="home-local-description">Webbdesign, webbutveckling och SEO för företag i Jönköping som vill nå fler kunder online.</span>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>

          <Link href="/webbyra-varnamo">
            <span>
              <strong>Webbyrå i Värnamo</strong>
              <span className="home-local-description">Mobilanpassade webbplatser och tydliga kontaktvägar för företag i Värnamo.</span>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>

          <Link href="/webbyra-vaggeryd">
            <span>
              <strong>Webbyrå i Vaggeryd</strong>
              <span className="home-local-description">Snabba webbplatser, lokal synlighet och personlig hjälp för företag i Vaggeryd och Skillingaryd.</span>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section className="site-section">
        <SectionHeader
          eyebrow="NÄSTA STEG"
          title="Har du ett projekt i tankarna?"
          description="Berätta kort vad du behöver så återkommer vi med ett förslag."
          centered
        />

        <div className="home-section-action">
          <Link
            href="/kontakt"
            className="site-button site-button-primary"
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
