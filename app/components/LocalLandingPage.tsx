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
};

export default function LocalLandingPage({
  city,
  title,
  description,
}: Props) {
  return (
    <div className="v2-page">
      <StandaloneLayout>

        {/* HERO */}
        <section className="v2-hero">
          <div className="v2-hero-copy">

            <span className="v2-pill">
              WEBBYRÅ I {city.toUpperCase()}
            </span>

            <h1>{title}</h1>

            <p>{description}</p>

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

        {/* TRUST */}
        <section className="v2-proof">
          <div>
            <Check size={22} />
            <span>Mobilanpassat</span>
          </div>

          <div>
            <Check size={22} />
            <span>SEO från början</span>
          </div>

          <div>
            <Check size={22} />
            <span>Personlig kontakt</span>
          </div>
        </section>

        {/* SERVICES */}
        <section className="v2-section v2-services">

          <div className="v2-section-header centered">
            <span>Våra tjänster</span>

            <h2>
              Allt ditt företag behöver online
            </h2>

            <p>
              Från design och utveckling till SEO och prestanda.
              Vi hjälper företag i {city} att bygga en starkare
              digital närvaro.
            </p>
          </div>

          <div className="v2-service-grid">

            <article className="v2-service-card">
              <div className="v2-icon">
                <Smartphone size={24} />
              </div>

              <h3>Webbdesign</h3>

              <p>
                Moderna och mobilanpassade hemsidor skapade
                för ditt företag och dina kunder.
              </p>
            </article>

            <article className="v2-service-card">
              <div className="v2-icon">
                <Search size={24} />
              </div>

              <h3>SEO</h3>

              <p>
                Vi hjälper ditt företag att bli mer synligt
                när potentiella kunder söker på Google.
              </p>
            </article>

            <article className="v2-service-card">
              <div className="v2-icon">
                <Code2 size={24} />
              </div>

              <h3>Webbutveckling</h3>

              <p>
                Moderna tekniska lösningar byggda efter
                ditt företags behov.
              </p>
            </article>

            <article className="v2-service-card">
              <div className="v2-icon">
                <Zap size={24} />
              </div>

              <h3>Prestanda</h3>

              <p>
                Snabba laddningstider och en bättre upplevelse
                för både besökare och sökmotorer.
              </p>
            </article>

          </div>
        </section>

        {/* LOCAL SEO */}
        <section className="v2-section v2-portfolio">

          <div className="v2-section-header">
            <span>Lokalt & personligt</span>

            <h2>
              Webbdesign för företag i {city}
            </h2>

            <p>
              Driver du företag i {city} och behöver en ny
              hemsida eller vill förbättra den du redan har?
              Staark hjälper företag att skapa moderna digitala
              lösningar med fokus på design, prestanda och
              synlighet.
            </p>
          </div>

        </section>

        {/* PROCESS */}
        <section className="v2-section v2-process">

          <div className="v2-section-header centered">
            <span>Så fungerar det</span>

            <h2>
              Från idé till färdig hemsida
            </h2>
          </div>

          <div className="v2-process-grid">

            <article>
              <strong>01</strong>
              <h3>Vi pratar</h3>
              <p>
                Vi går igenom ditt företag, dina mål
                och vad du behöver.
              </p>
            </article>

            <article>
              <strong>02</strong>
              <h3>Design</h3>
              <p>
                Vi skapar en modern design anpassad
                efter ditt företag.
              </p>
            </article>

            <article>
              <strong>03</strong>
              <h3>Utveckling</h3>
              <p>
                Vi bygger en snabb, responsiv och
                SEO-vänlig hemsida.
              </p>
            </article>

          </div>
        </section>

        {/* CTA */}
        <section className="v2-section v2-pricing">

          <div className="v2-section-header centered">

            <span>Redo att komma igång?</span>

            <h2>
              Redo för en bättre hemsida?
            </h2>

            <p>
              Berätta om ditt företag så återkommer
              vi med ett förslag.
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