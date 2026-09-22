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
    <div className="v2-page">
      <SeoJsonLd data={serviceJsonLd} />
      <StandaloneLayout>

        {/* HERO */}
        <section className="v2-hero">
          <div className="v2-hero-copy">

            <span className="v2-pill">
              {service.shortTitle}
            </span>

            <h1>{service.title}</h1>

            <p>{service.description}</p>

            <div className="v2-actions">
              <Link
                href="/kontakt"
                className="v2-button v2-button-primary"
              >
                Få kostnadsfri offert
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/tjanster"
                className="v2-button v2-button-light"
              >
                Alla tjänster
              </Link>
            </div>

          </div>
        </section>

        {/* INTRO */}
        <section className="v2-section">

          <Link
            href="/tjanster"
            className="flex items-center gap-2 text-[var(--v2-blue)]"
            style={{
              marginBottom: 48,
            }}
          >
            <ArrowLeft size={16} />
            Alla tjänster
          </Link>

          <div className="service-detail-grid">

            <div className="v2-section-header">
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
        <section className="v2-section v2-portfolio">

          <div className="v2-section-header centered">
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
        <section className="v2-section v2-process">

          <div className="v2-section-header centered">
            <span>SÅ FUNGERAR DET</span>

            <h2>
              En enkel väg från idé till resultat.
            </h2>
          </div>

          <div className="v2-process-grid">

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

        {/* CTA */}
        <section className="v2-section v2-pricing">

          <div className="v2-section-header centered">

            <span>DITT PROJEKT</span>

            <h2>
              Behöver du hjälp med {service.shortTitle.toLowerCase()}?
            </h2>

            <p>
              Berätta om ditt företag och vad du behöver
              så återkommer vi med ett förslag.
            </p>

            <div className="v2-actions">

              <Link
                href="/kontakt"
                className="v2-button v2-button-primary"
              >
                Kontakta oss
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

      </StandaloneLayout>
    </div>
  );
}