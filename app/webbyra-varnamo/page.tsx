import type { Metadata } from "next";

import LocalLandingPage from "../components/LocalLandingPage";

export const metadata: Metadata = {
  title: "Webbyrå Värnamo | Hemsida, webbdesign & SEO",
  description:
    "Webbyrå i Värnamo för företag som behöver en modern hemsida. Webbdesign, webbutveckling och lokal SEO med fokus på tydlighet och prestanda.",
  alternates: { canonical: "/webbyra-varnamo" },
  openGraph: {
    title: "Webbyrå Värnamo | Staark Inc.",
    description: "Webbdesign, webbutveckling och SEO för företag i Värnamo.",
    url: "/webbyra-varnamo",
    type: "website",
  },
};

export default function Page() {
  return (
    <LocalLandingPage
      city="Värnamo"
      canonicalPath="/webbyra-varnamo"
      title="Webbyrå i Värnamo för företag som vill synas bättre."
      description="Vi hjälper företag i Värnamo med webbdesign, webbutveckling och SEO – från en tydlig företagssida till en mer skräddarsydd digital lösning."
      localTitle="Gör det enkelt för kunden att förstå och välja ditt företag."
      localDescription="En bra företagswebbplats ska svara på kundens viktigaste frågor utan att de behöver leta: vad erbjuder ni, vem passar tjänsten för, varför ska kunden välja er och hur tar man kontakt? Vi bygger en tydlig struktur runt just de frågorna och kombinerar den med snabb teknik och en SEO-vänlig grund."
      localPoints={[
        "Tydliga tjänstesidor som beskriver vad ni erbjuder",
        "Lokal SEO för bättre synlighet i Värnamo",
        "Mobilanpassning och snabb laddning",
        "Lösningar som kan byggas vidare när behovet växer",
      ]}
      marketTitle="Från första intryck till konkret förfrågan."
      marketDescription="För många företag är webbplatsens viktigaste jobb att skapa förtroende och göra det lätt att ta nästa steg. Därför arbetar vi inte bara med utseendet, utan även med sidstruktur, innehåll och tydliga kontaktvägar."
      marketPoints={[
        {
          title: "Tjänster som är lätta att förstå",
          description: "Varje viktig tjänst får en tydlig plats så att besökaren snabbt kan avgöra om företaget kan lösa deras behov.",
        },
        {
          title: "Förtroende genom innehåll",
          description: "Projekt, konkreta fördelar, tydliga priser där det passar och relevant information hjälper kunden att känna sig tryggare innan kontakt.",
        },
        {
          title: "Teknisk grund för fortsatt tillväxt",
          description: "Vi bygger med modern teknik, prestanda och struktur i fokus så att webbplatsen kan utvecklas när företaget behöver fler sidor eller funktioner.",
        },
      ]}
      faq={[
        {
          question: "Vad kostar en ny hemsida i Värnamo?",
          answer: "Staark Inc. har ett startpris på 2 999 kr för enklare webbprojekt. Om företaget behöver fler sidor, specialdesign, integrationer eller andra funktioner tar vi fram ett anpassat förslag.",
        },
        {
          question: "Kan lokal SEO hjälpa ett företag i Värnamo?",
          answer: "Lokal SEO kan göra det tydligare för Google vilka tjänster företaget erbjuder och vilken geografisk marknad som är relevant. Det omfattar bland annat struktur, innehåll, metadata och interna länkar.",
        },
        {
          question: "Bygger ni bara enkla företagssidor?",
          answer: "Nej. Vi kan börja med en mindre webbplats men även bygga vidare med fler sidor, integrationer och skräddarsydd funktionalitet när behovet finns.",
        },
        {
          question: "Kan ni hjälpa efter att webbplatsen är lanserad?",
          answer: "Ja. Vi erbjuder support, underhåll, hosting, SEO och vidareutveckling efter lanseringen beroende på vad företaget behöver.",
        },
      ]}
    />
  );
}
