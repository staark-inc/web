import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { StandaloneLayout } from "../components/SiteChrome";
import { projects } from "../data/projects";

export const metadata: Metadata = {
  title: "Projekt | Webbdesign & Webbutveckling",
  description:
    "Se webbplatser och digitala projekt skapade av Staark Inc. för företag och organisationer.",

  alternates: {
    canonical: "/projekt",
  },

  openGraph: {
    title: "Våra projekt | Staark Inc.",
    description:
      "Se ett urval av webbplatser och digitala lösningar skapade av Staark Inc.",
    url: "/projekt",
    type: "website",
  },
};

export default function ProjektPage() {
  return (
    <div className="site-page">
      <StandaloneLayout>

        {/* HERO */}
        <section className="site-hero">
          <div className="site-hero-copy">

            <span className="site-pill">
              VÅRA PROJEKT
            </span>

            <h1>
              Vi bygger digitala
              upplevelser som fungerar.
            </h1>

            <p>
              Ett urval av webbplatser och digitala lösningar
              vi har designat och utvecklat.
            </p>

          </div>
        </section>

        {/* PROJECTS */}
        <section className="site-section site-portfolio">

          <div className="site-section-header">
            <span>UTVALDA PROJEKT</span>

            <h2>
              Några saker vi har byggt.
            </h2>

            <p>
              Från företagshemsidor till mer avancerade
              digitala lösningar.
            </p>
          </div>

          <div className="site-project-grid">

            {projects.map((project) => (
              <article
                key={project.slug}
                className="site-project"
              >

                <Image
                  src={project.image}
                  alt={`${project.title} webbprojekt`}
                  width={600}
                  height={400}
                />

                <div>

                  <div className="site-project-tags flex mb-4 gap-3">
                    {project.tags.map((tag) => (
                      <span key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3>{project.title}</h3>

                  <p>
                    {project.description}
                  </p>

                  <Link
                    href={`/projekt/${project.slug}`}
                    className="flex items-center align-center gap-4"
                    style={{ textDecoration: "none", color: "#3b82f6!important" }}
                  >
                    Se projektet {project.title}
                    <ArrowRight size={15} />
                  </Link>

                </div>

              </article>
            ))}

          </div>
        </section>

        {/* CTA */}
        <section className="site-section">

          <div className="site-section-header centered">

            <span>DITT PROJEKT</span>

            <h2>
              Ska vi bygga nästa tillsammans?
            </h2>

            <p>
              Berätta om ditt företag och vad du vill
              skapa så återkommer vi med ett förslag.
            </p>

            <div className="site-actions">
              <Link
                href="/kontakt"
                className="site-button site-button-primary"
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