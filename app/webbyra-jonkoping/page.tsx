import type { Metadata } from "next";

import LocalLandingPage from "../components/LocalLandingPage";

export const metadata: Metadata = {
  title: "Webbyrå Jönköping | Hemsida, webbdesign & SEO",
  description:
    "Webbyrå i Jönköping för små och växande företag. Webbdesign, webbutveckling och lokal SEO. Moderna webbplatser från 2 999 kr.",
  alternates: { canonical: "/webbyra-jonkoping" },
  openGraph: {
    title: "Webbyrå Jönköping | Staark Inc.",
    description: "Webbdesign, utveckling och SEO för företag i Jönköping.",
    url: "/webbyra-jonkoping",
    type: "website",
  },
};

export default function Page() {
  return (
    <LocalLandingPage
      city="Jönköping"
      canonicalPath="/webbyra-jonkoping"
      title="Webbyrå i Jönköping för företag som vill växa."
      description="Vi bygger moderna företagswebbplatser med tydlig design, snabb teknik och lokal SEO för företag som vill bli enklare att hitta och enklare att kontakta."
      localTitle="En webbplats som gör mer än att bara se bra ut."
      localDescription="När en potentiell kund söker efter en tjänst i Jönköping jämförs ofta flera företag på kort tid. Webbplatsen behöver därför snabbt förklara vad ni erbjuder, skapa förtroende och göra nästa steg tydligt. Vi bygger med den resan i åtanke – från första Google-sökningen till kontaktförfrågan."
      localPoints={[
        "Tydlig presentation av tjänster och erbjudande",
        "Lokal SEO för sökningar kopplade till Jönköping",
        "Snabb och mobilanpassad webbplats",
        "Tydliga vägar till offert och kontakt",
      ]}
      marketTitle="Byggd för att konkurrera om rätt uppmärksamhet."
      marketDescription="Bra lokal SEO handlar inte om att upprepa ortsnamnet överallt. Sidan behöver svara på det kunden faktiskt vill veta, vara tekniskt stark och ge Google en tydlig bild av företagets tjänster och relevans."
      marketPoints={[
        {
          title: "Synlighet i lokala sökningar",
          description: "Vi strukturerar tjänster, rubriker, metadata och interna länkar så att både kunder och sökmotorer lättare förstår vad företaget erbjuder.",
        },
        {
          title: "Tydlig differentiering",
          description: "Besökaren ska snabbt förstå varför de ska kontakta just er. Därför lyfter vi erbjudande, styrkor, projekt och tydliga nästa steg.",
        },
        {
          title: "Fler vägar till kontakt",
          description: "Offertknappar, kontaktvägar och relevant innehåll placeras där de hjälper besökaren vidare utan att göra sidan rörig.",
        },
      ]}
      faq={[
        {
          question: "Vad kostar en hemsida för ett företag i Jönköping?",
          answer: "Enklare webbprojekt hos Staark Inc. börjar från 2 999 kr. Större webbplatser och projekt med fler sidor, integrationer eller specialfunktioner får ett anpassat pris efter en tydlig genomgång.",
        },
        {
          question: "Ingår SEO när ni bygger webbplatsen?",
          answer: "Grundläggande teknisk SEO ingår i våra enklare webbprojekt. För företag som behöver mer lokal synlighet kan projektet även omfatta lokal SEO, innehållsstruktur och vidare optimering.",
        },
        {
          question: "Kan ni hjälpa ett företag som redan har en webbplats?",
          answer: "Ja. Vi kan gå igenom den befintliga webbplatsen och bedöma om det är bättre att förbättra den stegvis eller bygga en modernare lösning.",
        },
        {
          question: "Hur fungerar samarbetet om företaget finns i Jönköping?",
          answer: "Projektet kan skötas smidigt digitalt med tydliga avstämningar, delning av material och löpande feedback. Ni har en tydlig kontaktväg genom hela projektet.",
        },
      ]}
    />
  );
}
