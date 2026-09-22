import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import SeoJsonLd from "../../components/SeoJsonLd";
import { StandaloneLayout } from "../../components/SiteChrome";

import {
  absoluteUrl,
  ORGANIZATION_ID,
} from "@/lib/seo";
import { projects, getProjectBySlug } from "../../data/projects";
import { getProjectRelatedLinks } from "../../data/content-links";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Projekt hittades inte",
    };
  }

  return {
    title: `${project.title} | Projekt`,
    description: project.description,

    alternates: {
      canonical: `/projekt/${slug}`,
    },

    openGraph: {
      title: `${project.title} | Staark Inc.`,
      description: project.description,
      url: `/projekt/${slug}`,
      type: "website",
      images: [
        {
          url: project.image,
          alt: project.title,
        },
      ],
    },
  };
}

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;

  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const pageUrl = absoluteUrl(`/projekt/${project.slug}`);
  const relatedLinks = getProjectRelatedLinks(project.slug);

  const projectJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${pageUrl}#case-study`,
        name: project.title,
        description: project.description,
        url: pageUrl,
        image: absoluteUrl(project.image),
        inLanguage: "sv-SE",
        creator: {
          "@id": ORGANIZATION_ID,
        },
        about: project.services,
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
            name: "Projekt",
            item: absoluteUrl("/projekt"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: project.title,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="v2-page">
      <SeoJsonLd data={projectJsonLd} />
      <StandaloneLayout>

        {/* HERO */}
        <section className="v2-section">

          <Link
            href="/projekt"
            className="flex items-center gap-2 text-[var(--v2-blue)]"
            style={{
              marginTop: 0,
              marginBottom: 40,
            }}
          >
            <ArrowLeft size={16} />
            Alla projekt
          </Link>

          <div className="v2-section-header">
            <span>{project.category}</span>

            <h1>{project.title}</h1>

            <p>{project.description}</p>
          </div>

        </section>

        {/* PROJECT IMAGE */}
        <section
          style={{
            padding:
              "0 max(24px, calc((100% - 1200px) / 2)) 120px",
          }}
        >
          <Image
            src={project.image}
            alt={`${project.title} – projekt av Staark Inc.`}
            width={1200}
            height={750}
            priority
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "16px",
              border: "1px solid var(--v2-line)",
            }}
          />
        </section>

        {/* CASE STUDY */}
        <section className="v2-section v2-portfolio">

          <div className="project-case-grid">

            {/* SERVICES */}
            <aside>

              <div className="v2-section-header">
                <span>TJÄNSTER</span>
              </div>

              <div className="project-services">
                {project.services.map((service) => (
                  <div
                    key={service}
                    className="project-service"
                  >
                    <Check
                      size={18}
                      className="text-[var(--v2-blue)]"
                    />

                    <span>{service}</span>
                  </div>
                ))}
              </div>

            </aside>

            {/* STORY */}
            <div className="project-story">

              <div className="v2-section-header">
                <span>UTMANINGEN</span>

                <h2>
                  Vad behövde lösas?
                </h2>

                <p>{project.challenge}</p>
              </div>

              <div className="v2-section-header">
                <span>LÖSNINGEN</span>

                <h2>
                  Så löste vi det.
                </h2>

                <p>{project.solution}</p>
              </div>

              <div className="v2-section-header">
                <span>RESULTATET</span>

                <h2>
                  Slutresultatet.
                </h2>

                <p>{project.result}</p>
              </div>

            </div>

          </div>

        </section>

        {relatedLinks.length > 0 ? (
          <section className="v2-section v2-services">

            <div className="v2-section-header centered">
              <span>RELATERAT TILL PROJEKTET</span>

              <h2>
                Tjänster och guider bakom lösningen.
              </h2>

              <p>
                Läs mer om arbetssättet och tjänsterna som
                är relevanta för den här typen av projekt.
              </p>
            </div>

            <div className="v2-service-grid">
              {relatedLinks.map((link) => (
                <article
                  key={link.href}
                  className="v2-service-card"
                >
                  <span className="service-benefit-label">
                    {link.label}
                  </span>

                  <h3>{link.title}</h3>

                  <p>{link.description}</p>

                  <Link
                    href={link.href}
                    className="v2-text-link"
                  >
                    Läs mer
                    <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>

          </section>
        ) : null}

        {/* CTA */}
        <section className="v2-section">

          <div className="v2-section-header centered">

            <span>DITT PROJEKT</span>

            <h2>
              Vill du skapa något liknande?
            </h2>

            <p>
              Berätta om ditt företag och vad du behöver.
              Vi hjälper dig från idé till färdig webbplats.
            </p>

            <div className="v2-actions">

              <Link
                href="/kontakt"
                className="v2-button v2-button-primary"
              >
                Starta ett projekt
                <ArrowRight size={18} />
              </Link>

            </div>

          </div>

        </section>

      </StandaloneLayout>
    </div>
  );
}