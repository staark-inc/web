import type { Metadata } from "next";

import LocalLandingPage from "../components/LocalLandingPage";

export const metadata: Metadata = {
  title:
    "Webbyrå Vaggeryd | Webbdesign & SEO",

  description:
    "Webbdesign, webbutveckling och SEO för företag i Vaggeryd. Staark Inc. bygger moderna och snabba webbplatser med personlig kontakt.",

  alternates: {
    canonical: "/webbyra-vaggeryd",
  },

  openGraph: {
    title:
      "Webbyrå Vaggeryd | Staark Inc.",

    description:
      "Moderna webbplatser, webbdesign och SEO för företag i Vaggeryd.",

    url:
      "/webbyra-vaggeryd",

    type:
      "website",
  },
};

export default function Page() {
  return (
    <LocalLandingPage
      city="Vaggeryd"
      canonicalPath="/webbyra-vaggeryd"

      title="Webbyrå i Vaggeryd med personlig webbdesign och SEO."

      description="Vi hjälper företag i Vaggeryd att skapa moderna och lättanvända webbplatser med fokus på tydlighet, prestanda och personlig kontakt."

      localTitle="En modern webbplats som gör det enklare för kunder att hitta dig."

      localDescription="En bra webbplats ska snabbt visa vem du är, vad du erbjuder och hur kunden kan kontakta dig. Vi hjälper företag i Vaggeryd att skapa tydliga digitala lösningar som fungerar på både mobil och dator och är enkla att utveckla vidare när verksamheten växer."

      localPoints={[
        "Webbdesign anpassad efter ditt företag",
        "Mobilanpassning från start",
        "SEO-vänlig teknisk struktur",
        "Personlig kontakt genom hela projektet",
      ]}
    />
  );
}