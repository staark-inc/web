import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Code2,
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
      "Du pratar direkt med oss genom hela projektet. Inga onödiga mellanhänder eller komplicerade processer.",
  },
  {
    icon: Zap,
    title: "Enkelt & effektivt",
    description:
      "Vi fokuserar på det som faktiskt behövs för att skapa en snabb, tydlig och professionell webbplats.",
  },
  {
    icon: HeartHandshake,
    title: "Långsiktigt samarbete",
    description:
      "Vårt arbete behöver inte sluta vid lanseringen. Vi kan fortsätta hjälpa till med support, underhåll och utveckling.",
  },
];

const principles = [
  "Modern och responsiv design",
  "Snabba webbplatser",
  "SEO-vänlig struktur",
  "Tydlig kommunikation",
  "Lösningar anpassade efter företaget",
];

export default function OmOssPage() {
  return (
    <div className="v2-page">
      <StandaloneLayout>

        {/* HERO */}
        <section className="v2-hero">

          <div className="v2-hero-copy">

            <span className="v2-pill">
              OM STAARK INC.
            </span>

            <h1>
              Vi gör webben enklare för företag.
            </h1>

            <p>
              Staark Inc. hjälper företag att skapa moderna,
              snabba och professionella webbplatser med fokus
              på tydlighet, prestanda och resultat.
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


        {/* STORY */}
        <section className="v2-section about-story">

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

            <div className="v2-section-header">

              <span>
                VÅR IDÉ
              </span>

              <h2>
                Bra webb behöver inte vara komplicerat.
              </h2>

              <p>
                Många mindre företag behöver en professionell
                webbplats men inte en lång och komplicerad
                utvecklingsprocess.
              </p>

              <p>
                Därför bygger vi lösningar med fokus på det
                som betyder mest: tydlig design, snabb
                laddning, bra användarupplevelse och en
                webbplats som fungerar på alla enheter.
              </p>

              <p>
                Varje företag är olika. Därför anpassar vi
                lösningen efter verksamheten istället för att
                försöka pressa alla projekt in i samma mall.
              </p>

            </div>

          </div>

        </section>


        {/* LOCAL */}
        <section className="v2-section v2-portfolio">

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


        {/* VALUES */}
        <section className="v2-section">

          <div className="v2-section-header centered">

            <span>
              SÅ ARBETAR VI
            </span>

            <h2>
              En enklare väg till en bättre webbplats.
            </h2>

            <p>
              Tydlig kommunikation, modern teknik och
              lösningar byggda efter verkliga behov.
            </p>

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


        {/* WHAT WE CARE ABOUT */}
        <section className="v2-section v2-portfolio">

          <div className="about-principles">

            <div>

              <div className="v2-section-header">

                <span>
                  VAD VI FOKUSERAR PÅ
                </span>

                <h2>
                  En webbplats ska göra sitt jobb.
                </h2>

                <p>
                  Snygg design är viktigt, men webbplatsen
                  behöver också vara snabb, enkel att använda
                  och hjälpa besökaren att hitta rätt.
                </p>

              </div>

              <Link
                href="/tjanster"
                className="v2-text-link"
              >
                Se våra tjänster
                <ArrowRight size={15} />
              </Link>

            </div>


            <div className="about-principles-list">

              {principles.map((item) => (

                <div key={item}>

                  <span>
                    <Check size={17} />
                  </span>

                  <strong>
                    {item}
                  </strong>

                </div>

              ))}

            </div>

          </div>

        </section>


        {/* CTA */}
        <section className="v2-section">

          <div className="about-cta">

            <div className="about-cta-icon">
              <Code2 size={26} />
            </div>

            <span>
              HAR DU ETT PROJEKT?
            </span>

            <h2>
              Låt oss bygga något bra tillsammans.
            </h2>

            <p>
              Berätta om ditt företag och vad du vill
              uppnå så hjälper vi dig att hitta rätt
              lösning.
            </p>

            <Link
              href="/kontakt"
              className="v2-button v2-button-primary"
            >
              Berätta om ditt projekt
              <ArrowRight size={18} />
            </Link>

          </div>

        </section>

      </StandaloneLayout>
    </div>
  );
}