import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Code2,
  Mail,
  MapPin,
  Search,
  Smartphone,
  Zap,
} from "lucide-react";

import ContactForm from "./components/ContactForm";
import ClientFaqItem from "./components/ClientFaqItem";
import {
  SiteHeader,
  SiteFooter,
} from "./components/SiteChrome";

import { projects } from "./data/projects";

export const metadata: Metadata = {
  title: "Webbyrå i Jönköping & Värnamo",
  description:
    "Staark Inc. bygger moderna, snabba och SEO-optimerade hemsidor för företag i Jönköping, Värnamo och Småland. Webbplatser från 2 999 kr.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Webbyrå i Jönköping & Värnamo | Staark Inc.",
    description:
      "Moderna hemsidor, webbdesign, SEO och webbutveckling för företag i Småland.",
    url: "/",
    type: "website",
  },
};

const services = [
  {
    slug: "webbdesign",
    icon: Smartphone,
    title: "Webbdesign",
    description:
      "Modern och responsiv design anpassad efter ditt företag och dina kunder.",
  },
  {
    slug: "webbutveckling",
    icon: Code2,
    title: "Webbutveckling",
    description:
      "Snabba och moderna webbplatser byggda med teknik som kan växa med ditt företag.",
  },
  {
    slug: "seo",
    icon: Search,
    title: "SEO & synlighet",
    description:
      "En tekniskt SEO-vänlig grund som hjälper kunder att hitta ditt företag online.",
  },
  {
    slug: "prestanda",
    icon: Zap,
    title: "Prestanda",
    description:
      "Snabb laddning och en bättre upplevelse på både mobil och dator.",
  },
];

const faqs = [
  [
    "Vad kostar en webbplats?",
    "Enklare webbplatser börjar från 2 999 kr. Större och mer avancerade projekt får ett anpassat pris.",
  ],
  [
    "Hur lång tid tar det att bygga en webbplats?",
    "Tiden beror på projektets omfattning, innehåll och funktioner. Vi går igenom tidsplanen innan projektet börjar.",
  ],
  [
    "Kan ni hjälpa företag i Jönköping och Värnamo?",
    "Ja. Vi arbetar med företag i Jönköping, Värnamo och andra delar av Småland.",
  ],
  [
    "Kan ni hjälpa till efter lanseringen?",
    "Ja. Vi kan hjälpa till med support, underhåll, hosting och fortsatta förbättringar.",
  ],
] as const;

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

      {description && <p>{description}</p>}
    </div>
  );
}

export default function Page() {
  const featuredProjects = projects.slice(0, 3);

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
            Vi designar och utvecklar moderna, snabba och
            SEO-vänliga webbplatser för företag i Jönköping,
            Värnamo och Småland.
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
          TRUST / BENEFITS
      ===================================================== */}

      <section className="v2-proof">

        <div>
          <Check size={20} />

          <span>
            Mobilanpassade webbplatser
          </span>
        </div>

        <div>
          <Check size={20} />

          <span>
            SEO från början
          </span>
        </div>

        <div>
          <Check size={20} />

          <span>
            Personlig kontakt
          </span>
        </div>

      </section>


      {/* =====================================================
          SERVICES
      ===================================================== */}

      <section className="v2-section v2-services">

        <SectionHeader
          eyebrow="VAD VI GÖR"
          title="Allt ditt företag behöver online."
          description="Från design och utveckling till SEO och prestanda. Vi hjälper dig genom hela processen."
        />


        <div className="v2-service-grid">

          {services.map((service) => {
            const Icon = service.icon;

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
            Se alla tjänster
            <ArrowRight size={17} />
          </Link>

        </div>

      </section>


      {/* =====================================================
          PROJECTS
      ===================================================== */}

      <section className="v2-section v2-portfolio">

        <SectionHeader
          eyebrow="VÅRA PROJEKT"
          title="Några av våra senaste projekt."
          description="Se exempel på webbplatser och digitala lösningar vi har arbetat med."
        />


        <div className="v2-project-grid">

          {featuredProjects.map((project) => (

            <article
              className="v2-project"
              key={project.slug}
            >

              <Link href={`/projekt/${project.slug}`}>

                <Image
                  src={project.image}
                  alt={`${project.title} – projekt av Staark Inc.`}
                  width={512}
                  height={373}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />

              </Link>


              <div>

                <div className="v2-project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>

                <h3>
                  {project.title}
                </h3>

                <p>
                  {project.description}
                </p>

                <Link
                  href={`/projekt/${project.slug}`}
                  className="v2-text-link"
                >
                  Se projekt
                  <ArrowRight size={15} />
                </Link>

              </div>

            </article>

          ))}

        </div>


        <div className="home-section-action">

          <Link
            href="/projekt"
            className="v2-button v2-button-light"
          >
            Se alla projekt
            <ArrowRight size={17} />
          </Link>

        </div>

      </section>


      {/* =====================================================
          PROCESS
      ===================================================== */}

      <section className="v2-section v2-process">

        <SectionHeader
          eyebrow="PROCESSEN"
          title="Från idé till färdig webbplats."
          description="En tydlig process utan onödig komplexitet."
          centered
        />


        <div className="v2-process-grid">

          <article>

            <strong>01</strong>

            <h3>
              Vi pratar
            </h3>

            <p>
              Vi går igenom ditt företag, dina kunder,
              dina mål och vad webbplatsen behöver.
            </p>

          </article>


          <article>

            <strong>02</strong>

            <h3>
              Vi designar & bygger
            </h3>

            <p>
              Vi skapar en modern lösning med fokus på
              design, användarupplevelse och prestanda.
            </p>

          </article>


          <article>

            <strong>03</strong>

            <h3>
              Vi lanserar
            </h3>

            <p>
              När allt är klart lanserar vi webbplatsen
              och kan fortsätta hjälpa dig efteråt.
            </p>

          </article>

        </div>

      </section>


      {/* =====================================================
          PRICE PREVIEW
      ===================================================== */}

      <section className="v2-section v2-pricing">

        <div className="home-price">

          <div className="v2-section-header">

            <span>
              TYDLIGA PRISER
            </span>

            <h2>
              En professionell webbplats från 2 999 kr.
            </h2>

            <p>
              Börja enkelt eller välj en mer avancerad
              lösning. Vi går igenom vad ditt företag
              behöver innan projektet börjar.
            </p>

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
          LOCAL
      ===================================================== */}

      <section className="v2-section home-local">

        <SectionHeader
          eyebrow="LOKALT I SMÅLAND"
          title="Webbdesign nära ditt företag."
          description="Vi hjälper lokala företag att skapa en starkare digital närvaro."
          centered
        />


        <div className="home-local-links">

          <Link href="/webbyra-jonkoping">
            Webbyrå Jönköping
            <ArrowRight size={17} />
          </Link>

          <Link href="/webbyra-varnamo">
            Webbyrå Värnamo
            <ArrowRight size={17} />
          </Link>

          <Link href="/webbyra-vaggeryd">
            Webbyrå Vaggeryd
            <ArrowRight size={17} />
          </Link>

        </div>

      </section>


      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section className="v2-section v2-about">

        <Image
          src="/figma-v2/about.png"
          alt="Staark Inc. – webbyrå i Småland"
          width={512}
          height={373}
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 50vw"
        />


        <div>

          <SectionHeader
            eyebrow="OM STAARK"
            title="Digitala lösningar med personlig kontakt."
            description="Vi hjälper företag att skapa moderna webbplatser utan att göra processen mer komplicerad än den behöver vara."
          />

          <Link
            className="v2-text-link"
            href="/om-oss"
          >
            Läs mer om oss
            <ArrowRight size={15} />
          </Link>

        </div>

      </section>


      {/* =====================================================
          FAQ
      ===================================================== */}

      <section className="v2-section v2-faq">

        <SectionHeader
          eyebrow="VANLIGA FRÅGOR"
          title="Allt du behöver veta."
          centered
        />


        <div className="v2-faq-list">

          {faqs.map(
            ([question, answer], index) => (

              <ClientFaqItem
                key={question}
                question={question}
                answer={answer}
                index={index}
              />

            )
          )}

        </div>

      </section>


      {/* =====================================================
          CONTACT
      ===================================================== */}

      <section
        className="v2-section v2-contact"
        id="contact"
      >

        <div>

          <SectionHeader
            eyebrow="KONTAKTA OSS"
            title="Låt oss prata om ditt nästa projekt."
            description="Berätta vad du behöver så återkommer vi med ett förslag anpassat efter ditt företag."
          />


          <div className="v2-contact-details">

            <a href="mailto:contact@staarkinc.com">
              <Mail size={18} />
              contact@staarkinc.com
            </a>

            <span>
              <MapPin size={18} />
              Jönköping, Värnamo & Småland
            </span>

          </div>

        </div>


        <ContactForm />

      </section>


      <SiteFooter />

    </main>
  );
}