import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";

import SeoJsonLd from "../../components/SeoJsonLd";
import { StandaloneLayout } from "../../components/SiteChrome";

import {
  absoluteUrl,
  ORGANIZATION_ID,
} from "@/lib/seo";
import {
  services,
  getServiceBySlug,
} from "../../data/services";
import { getServiceRelatedGuides } from "../../data/content-links";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Tjänsten hittades inte",
    };
  }

  return {
    title: service.title,
    description: service.description,

    alternates: {
      canonical: `/tjanster/${slug}`,
    },

    openGraph: {
      title: `${service.shortTitle} | Staark Inc.`,
      description: service.description,
      url: `/tjanster/${slug}`,
      type: "website",
    },
  };
}

export function generateStaticParams() {
  return services.map((service) => ({
    slug: service.slug,
  }));
}

export default async function ServicePage({
  params,
}: Props) {
  const { slug } = await params;

  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const pageUrl = absoluteUrl(`/tjanster/${slug}`);
  const relatedGuides = getServiceRelatedGuides(service.slug);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: service.title,
        serviceType: service.shortTitle,
        description: service.description,
        url: pageUrl,
        provider: {
          "@id": ORGANIZATION_ID,
        },
        areaServed: {
          "@type": "AdministrativeArea",
          name: "Småland",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Start",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Tjänster",
            item: absoluteUrl("/tjanster"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: service.shortTitle,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="site-page">
      <SeoJsonLd data={serviceJsonLd} />
      <StandaloneLayout>

        {/* HERO */}
        <section className="site-hero">
          <div className="site-hero-copy">

            <span className="site-pill">
              {service.shortTitle}
            </span>

            <h1>{service.title}</h1>

            <p>{service.description}</p>

            <div className="site-actions">
              <Link
                href="/kontakt"
                className="site-button site-button-primary"
              >
                Få kostnadsfri offert
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/tjanster"
                className="site-button site-button-light"
              >
                Alla tjänster
              </Link>
            </div>

          </div>
        </section>

        {/* INTRO */}
        <section className="site-section">

          <Link
            href="/tjanster"
            className="flex items-center gap-2 text-[var(--site-blue)]"
            style={{
              marginBottom: 48,
            }}
          >
            <ArrowLeft size={16} />
            Alla tjänster
          </Link>

          <div className="service-detail-grid">

            <div className="site-section-header">
              <span>OM TJÄNSTEN</span>

              <h2>
                {service.shortTitle} anpassad efter ditt företag.
              </h2>

              <p>{service.intro}</p>
            </div>

            <div className="service-benefit-card">

              <span className="service-benefit-label">
                FÖRDELAR
              </span>

              <div className="service-benefits">
                {service.benefits.map((benefit) => (
                  <div key={benefit}>
                    <span className="service-check">
                      <Check size={17} />
                    </span>

                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

            </div>

          </div>

        </section>

        {/* INCLUDED */}
        <section className="site-section site-portfolio">

          <div className="site-section-header centered">
            <span>VAD INGÅR?</span>

            <h2>
              Det här kan vi hjälpa dig med.
            </h2>

            <p>
              Lösningen anpassas efter ditt företag,
              dina mål och vad webbplatsen behöver.
            </p>
          </div>

          <div className="service-includes-grid">

            {service.includes.map((item, index) => (
                <article
                key={item}
                className="service-include-card"
                >
                <strong>
                    {String(index + 1).padStart(2, "0")}
                </strong>

                <div className="service-include-title">
                    <h3>{item}</h3>

                    <Check size={20} />
                </div>
                </article>
            ))}

          </div>

        </section>

        {/* PROCESS */}
        <section className="site-section site-process">

          <div className="site-section-header centered">
            <span>SÅ FUNGERAR DET</span>

            <h2>
              En enkel väg från idé till resultat.
            </h2>
          </div>

          <div className="site-process-grid">

            <article>
              <strong>01</strong>
              <h3>Vi lyssnar</h3>
              <p>
                Vi börjar med att förstå ditt företag,
                dina behov och dina mål.
              </p>
            </article>

            <article>
              <strong>02</strong>
              <h3>Vi bygger</h3>
              <p>
                Vi tar fram en lösning anpassad efter
                projektet och ditt företag.
              </p>
            </article>

            <article>
              <strong>03</strong>
              <h3>Vi levererar</h3>
              <p>
                Vi går igenom resultatet och hjälper dig
                vidare efter lanseringen.
              </p>
            </article>

          </div>

        </section>

        {relatedGuides.length > 0 ? (
          <section className="site-section site-services">

            <div className="site-section-header centered">
              <span>GUIDER & KUNSKAP</span>

              <h2>
                Läs mer om {service.shortTitle.toLowerCase()}.
              </h2>

              <p>
                Praktiska guider som hjälper dig att förstå
                valen bakom en bättre webbplats.
              </p>
            </div>

            <div className="site-service-grid">
              {relatedGuides.map((guide) => (
                <article
                  key={guide.href}
                  className="site-service-card"
                >
                  <span className="service-benefit-label">
                    {guide.label}
                  </span>

                  <h3>{guide.title}</h3>

                  <p>{guide.description}</p>

                  <Link
                    href={guide.href}
                    className="site-text-link"
                  >
                    Läs guiden: {guide.title}
                    <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>

          </section>
        ) : null}

        {/* CTA */}
        <section className="site-section site-pricing">

          <div className="site-section-header centered">

            <span>DITT PROJEKT</span>

            <h2>
              Behöver du hjälp med {service.shortTitle.toLowerCase()}?
            </h2>

            <p>
              Berätta om ditt företag och vad du behöver
              så återkommer vi med ett förslag.
            </p>

            <div className="site-actions">

              <Link
                href="/kontakt"
                className="site-button site-button-primary"
              >
                Kontakta oss
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

      </StandaloneLayout>
    </div>
  );
}