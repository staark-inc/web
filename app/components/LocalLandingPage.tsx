import Link from "next/link";

import {
  ArrowRight,
  Check,
  Code2,
  Search,
  Smartphone,
  Zap,
} from "lucide-react";

import SeoJsonLd from "./SeoJsonLd";
import { StandaloneLayout } from "./SiteChrome";

import {
  absoluteUrl,
  ORGANIZATION_ID,
} from "@/lib/seo";

type LocalPoint = {
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type Props = {
  city: string;
  canonicalPath: string;
  title: string;
  description: string;
  localTitle: string;
  localDescription: string;
  localPoints?: string[];
  marketTitle: string;
  marketDescription: string;
  marketPoints: LocalPoint[];
  faq: FaqItem[];
};

const services = [
  {
    slug: "webbdesign",
    icon: Smartphone,
    title: "Webbdesign",
    description:
      "Modern och mobilanpassad design skapad för ditt företag och dina kunder.",
  },
  {
    slug: "seo",
    icon: Search,
    title: "SEO & synlighet",
    description:
      "En teknisk grund som hjälper rätt kunder att hitta ditt företag på Google.",
  },
  {
    slug: "webbutveckling",
    icon: Code2,
    title: "Webbutveckling",
    description:
      "Snabba och moderna lösningar byggda efter företagets behov.",
  },
  {
    slug: "prestanda",
    icon: Zap,
    title: "Prestanda",
    description:
      "Snabba laddningstider och en bättre upplevelse på mobil och dator.",
  },
];

const resources = [
  {
    href: "/blog/vad-kostar-en-hemsida",
    label: "PRISGUIDE",
    title: "Vad kostar en hemsida för företag?",
    description:
      "Se vad som påverkar priset och vad som är bra att ha klart innan du beställer en ny webbplats.",
  },
  {
    href: "/blog/seo-for-smaforetag",
    label: "SEO-GUIDE",
    title: "SEO för småföretag – en enkel guide",
    description:
      "En praktisk introduktion till teknisk SEO, lokal synlighet och innehåll som hjälper sökmotorer förstå företaget.",
  },
  {
    href: "/blog/webbdesign-for-smaforetag",
    label: "WEBBDESIGN",
    title: "Webbdesign för småföretag",
    description:
      "Fem saker som gör en företagswebbplats tydligare, snabbare och enklare att använda.",
  },
];

export default function LocalLandingPage({
  city,
  canonicalPath,
  title,
  description,
  localTitle,
  localDescription,
  localPoints = [],
  marketTitle,
  marketDescription,
  marketPoints,
  faq,
}: Props) {
  const pageUrl = absoluteUrl(canonicalPath);

  const localJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: `Webbdesign och SEO i ${city}`,
        serviceType: ["Webbdesign", "Webbutveckling", "SEO"],
        description,
        url: pageUrl,
        provider: { "@id": ORGANIZATION_ID },
        areaServed: { "@type": "City", name: city },
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
            name: `Webbyrå ${city}`,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="v2-page">
      <SeoJsonLd data={localJsonLd} />
      <StandaloneLayout>
        <section className="v2-hero">
          <div className="v2-hero-copy">
            <span className="v2-pill">
              WEBBYRÅ I {city.toUpperCase()}
            </span>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="v2-actions">
              <Link href="/kontakt" className="v2-button v2-button-primary">
                Få kostnadsfri offert
                <ArrowRight size={18} />
              </Link>
              <Link href="/projekt" className="v2-button v2-button-light">
                Se våra projekt
              </Link>
            </div>
          </div>
        </section>

        <section className="v2-proof">
          <div><Check size={20} /><span>Personlig kontakt</span></div>
          <div><Check size={20} /><span>Mobilanpassat från start</span></div>
          <div><Check size={20} /><span>SEO & prestanda i fokus</span></div>
        </section>

        <section className="v2-section v2-section-responsive">
          <div className="v2-section-header">
            <span>WEBBDESIGN I {city.toUpperCase()}</span>
            <h2>{localTitle}</h2>
            <p>{localDescription}</p>
          </div>

          {localPoints.length > 0 ? (
            <div className="about-principles-list">
              {localPoints.map((point) => (
                <div key={point}>
                  <span><Check size={17} /></span>
                  <strong>{point}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="v2-section v2-process">
          <div className="v2-section-header centered">
            <span>FÖR FÖRETAG I {city.toUpperCase()}</span>
            <h2>{marketTitle}</h2>
            <p>{marketDescription}</p>
          </div>

          <div className="v2-process-grid">
            {marketPoints.map((point, index) => (
              <article key={point.title}>
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                <h3>{point.title}</h3>
                <p>{point.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="v2-section v2-services">
          <div className="v2-section-header centered">
            <span>VÅRA TJÄNSTER</span>
            <h2>Webbdesign, utveckling och SEO i {city}.</h2>
            <p>
              Vi kombinerar design, teknik, lokal synlighet
              och prestanda i samma webbprojekt.
            </p>
          </div>

          <div className="v2-service-grid">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article key={service.slug} className="v2-service-card">
                  <div className="v2-icon">
                    <Icon size={24} className="text-[var(--v2-blue)]" />
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <Link href={`/tjanster/${service.slug}`} className="v2-text-link">
                    Läs mer
                    <ArrowRight size={15} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="v2-section">
          <div className="service-detail-grid">
            <div className="v2-section-header">
              <span>PRIS & OMFATTNING</span>
              <h2>Vad kostar en hemsida i {city}?</h2>
              <p>
                Enklare webbprojekt hos Staark Inc. börjar från 2 999 kr.
                Det slutliga priset beror på antal sidor, design, innehåll,
                integrationer och vilka funktioner företaget behöver.
              </p>
              <Link href="/priser" className="v2-text-link">
                Se priser och vad som ingår
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="service-benefit-card">
              <span className="service-benefit-label">TYDLIGT FRÅN START</span>
              <div className="service-benefits">
                <div><span className="service-check"><Check size={17} /></span><span>Webbplatser från 2 999 kr</span></div>
                <div><span className="service-check"><Check size={17} /></span><span>Tydligt förslag innan projektstart</span></div>
                <div><span className="service-check"><Check size={17} /></span><span>Mobilanpassning och grundläggande SEO</span></div>
                <div><span className="service-check"><Check size={17} /></span><span>Support och vidareutveckling vid behov</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="v2-section v2-services">
          <div className="v2-section-header centered">
            <span>GUIDER FÖR FÖRETAG</span>
            <h2>Läs innan du bestämmer dig.</h2>
            <p>
              Praktiska guider om pris, SEO och webbdesign
              för mindre och växande företag.
            </p>
          </div>

          <div className="v2-service-grid">
            {resources.map((resource) => (
              <article key={resource.href} className="v2-service-card">
                <span className="service-benefit-label">{resource.label}</span>
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
                <Link href={resource.href} className="v2-text-link">
                  Läs guiden
                  <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="v2-section">
          <div className="v2-section-header centered">
            <span>VANLIGA FRÅGOR</span>
            <h2>Webbyrå och hemsida i {city}.</h2>
          </div>

          <div className="pricing-faq">
            {faq.map((item) => (
              <article key={item.question} className="pricing-faq-item">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="v2-section v2-pricing">
          <div className="v2-section-header centered">
            <span>NÄSTA STEG</span>
            <h2>Behöver ditt företag i {city} en bättre webbplats?</h2>
            <p>
              Berätta kort vad du behöver så återkommer
              vi med ett förslag anpassat efter ditt företag.
            </p>
            <div className="v2-actions">
              <Link href="/kontakt" className="v2-button v2-button-primary">
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
