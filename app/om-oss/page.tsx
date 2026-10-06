import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Zap,
} from "lucide-react";

import { StandaloneLayout } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "Om oss",

  description:
    "Lär känna Staark Inc. – en webbyrå som hjälper företag i Jönköping, Värnamo och Småland med webbdesign, utveckling och digital synlighet.",

  alternates: {
    canonical: "/om-oss",
  },

  openGraph: {
    title: "Om Staark Inc.",

    description:
      "Vi hjälper företag att skapa moderna, snabba och professionella webbplatser.",

    url: "/om-oss",

    type: "website",
  },
};

const values = [
  {
    icon: MessageCircle,

    title: "Personlig kontakt",

    description:
      "Du har direkt kontakt med oss genom hela projektet utan onödiga mellanhänder.",
  },

  {
    icon: Zap,

    title: "Enkelt & effektivt",

    description:
      "Vi fokuserar på det som faktiskt behövs för att skapa en modern och fungerande lösning.",
  },

  {
    icon: HeartHandshake,

    title: "Långsiktigt samarbete",

    description:
      "Vi kan fortsätta hjälpa med support, underhåll och utveckling även efter lanseringen.",
  },
];

export default function OmOssPage() {
  return (
    <div className="site-page">

      <StandaloneLayout>

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="site-hero">

          <div className="site-hero-copy">

            <span className="site-pill">
              OM STAARK INC.
            </span>

            <h1>
              Digitala lösningar utan onödig komplexitet.
            </h1>

            <p>
              Vi hjälper företag att skapa moderna,
              snabba och professionella webbplatser
              med personlig kontakt genom hela processen.
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


        {/* =====================================================
            STORY
        ===================================================== */}

        <section className="site-section about-story">

          <div className="about-story-image">

            <Image
              src="/figma-v2/about.png"
              alt="Staark Inc. webbyrå i Småland"
              width={620}
              height={460}
              sizes="(max-width: 900px) 100vw, 50vw"
              priority
            />

          </div>


          <div className="about-story-content">

            <div className="site-section-header">

              <span>
                VÅR IDÉ
              </span>

              <h2>
                Bra webb behöver inte vara komplicerat.
              </h2>

              <p>
                Många företag behöver en professionell
                digital närvaro utan en lång och
                komplicerad utvecklingsprocess.
              </p>

              <p>
                Därför bygger vi lösningar med fokus på
                tydlig design, snabb prestanda och en
                användarupplevelse som fungerar på alla
                enheter.
              </p>

              <p>
                Varje företag har olika behov. Vi anpassar
                därför lösningen efter verksamheten istället
                för att försöka passa alla projekt i samma
                mall.
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            VALUES
        ===================================================== */}

        <section className="site-section">

          <div className="site-section-header centered">

            <span>
              SÅ ARBETAR VI
            </span>

            <h2>
              En enklare väg till en bättre lösning.
            </h2>

          </div>


          <div className="about-values">

            {values.map((value) => {
              const Icon = value.icon;

              return (
                <article
                  key={value.title}
                  className="about-value-card"
                >

                  <div className="about-value-icon">

                    <Icon size={23} />

                  </div>


                  <h3>
                    {value.title}
                  </h3>


                  <p>
                    {value.description}
                  </p>

                </article>
              );
            })}

          </div>

        </section>


        {/* =====================================================
            LOCAL
        ===================================================== */}

        <section className="site-section site-portfolio">

          <div className="about-local">

            <div className="about-local-icon">

              <MapPin size={26} />

            </div>


            <div>

              <span className="about-label">
                LOKALT I SMÅLAND
              </span>

              <h2>
                Nära företagen vi hjälper.
              </h2>

              <p>
                Vi arbetar med företag i Jönköping,
                Värnamo, Vaggeryd och andra delar av
                Småland.
              </p>


              <div className="about-local-links">

                <Link href="/webbyra-jonkoping">
                  Jönköping
                  <ArrowRight size={15} />
                </Link>

                <Link href="/webbyra-varnamo">
                  Värnamo
                  <ArrowRight size={15} />
                </Link>

                <Link href="/webbyra-vaggeryd">
                  Vaggeryd
                  <ArrowRight size={15} />
                </Link>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="site-section site-pricing">

          <div className="site-section-header centered">

            <span>
              NÄSTA STEG
            </span>

            <h2>
              Har du ett projekt i tankarna?
            </h2>

            <p>
              Berätta kort vad du behöver så hjälper vi dig
              hitta rätt lösning.
            </p>


            <div className="site-actions">

              <Link
                href="/kontakt"
                className="site-button site-button-primary"
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