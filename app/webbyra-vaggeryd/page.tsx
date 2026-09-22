import type { Metadata } from "next";

import LocalLandingPage from "../components/LocalLandingPage";

export const metadata: Metadata = {
  title: "Webbyrå Vaggeryd | Hemsida, webbdesign & SEO",
  description:
    "Webbyrå i Vaggeryd med personlig kontakt. Moderna hemsidor, webbdesign, webbutveckling och lokal SEO för mindre och växande företag.",
  alternates: { canonical: "/webbyra-vaggeryd" },
  openGraph: {
    title: "Webbyrå Vaggeryd | Staark Inc.",
    description: "Moderna webbplatser, webbdesign och SEO för företag i Vaggeryd.",
    url: "/webbyra-vaggeryd",
    type: "website",
  },
};

export default function Page() {
  return (
    <LocalLandingPage
      city="Vaggeryd"
      canonicalPath="/webbyra-vaggeryd"
      title="Webbyrå i Vaggeryd med personlig webbdesign och SEO."
      description="Vi hjälper företag i Vaggeryd att få en modern, snabb och lättanvänd webbplats som tydligt visar vad företaget erbjuder och gör det enkelt för kunder att ta kontakt."
      localTitle="Lokal närvaro behöver en tydlig digital grund."
      localDescription="För ett mindre eller lokalt företag behöver webbplatsen inte vara onödigt komplicerad. Den behöver vara snabb, professionell och tydlig. Kunden ska direkt förstå vad ni gör, var ni arbetar och hur man kommer i kontakt med er. Därför prioriterar vi enkel struktur, mobil upplevelse och lokal sökbarhet från början."
      localPoints={[
        "Webbdesign anpassad efter företagets faktiska behov",
        "Lokal SEO och tydlig information om verksamheten",
        "Mobilanpassning och bra prestanda från start",
        "Personlig kontakt genom hela projektet",
      ]}
      marketTitle="Professionellt lokalt – utan onödig komplexitet."
      marketDescription="En stark webbplats för ett företag i Vaggeryd behöver inte vara stor. Det viktigaste är att rätt information finns på rätt plats, att sidan fungerar snabbt på mobilen och att det är enkelt för en potentiell kund att förstå nästa steg."
      marketPoints={[
        {
          title: "Lokalt förtroende",
          description: "Tydlig information om tjänster, arbetsområde och kontaktvägar gör det enklare för en lokal kund att avgöra om företaget är rätt val.",
        },
        {
          title: "Mobilen först i praktiken",
          description: "Många första besök sker på en mindre skärm. Därför bygger vi navigation, texter, knappar och formulär så att de fungerar smidigt även på mobilen.",
        },
        {
          title: "Enkel att utveckla vidare",
          description: "Företaget kan börja med det viktigaste och senare bygga vidare med nya tjänstesidor, guider, integrationer eller andra funktioner.",
        },
      ]}
      faq={[
        {
          question: "Vad kostar en företagshemsida i Vaggeryd?",
          answer: "Enklare webbprojekt hos Staark Inc. börjar från 2 999 kr. Ni får ett tydligt förslag innan projektet startar och priset anpassas efter sidantal, design, innehåll och funktioner.",
        },
        {
          question: "Hjälper ni till med lokal SEO i Vaggeryd?",
          answer: "Ja. Vi bygger en SEO-vänlig teknisk grund och kan hjälpa med lokal struktur, innehåll, metadata och interna länkar så att både kunder och sökmotorer lättare förstår verksamheten.",
        },
        {
          question: "Passar Staark Inc. även mindre företag?",
          answer: "Ja. En mindre webbplats kan vara helt rätt om den förklarar erbjudandet tydligt och gör det enkelt att ta kontakt. Lösningen kan sedan växa i takt med företaget.",
        },
        {
          question: "Arbetar ni även med företag utanför Vaggeryd?",
          answer: "Ja. Vi arbetar med företag i Jönköping, Värnamo, Vaggeryd och övriga Småland, och samarbetet kan även skötas digitalt.",
        },
      ]}
    />
  );
}
