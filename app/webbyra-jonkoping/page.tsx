import type { Metadata } from "next";

import LocalLandingPage from "../components/LocalLandingPage";

export const metadata: Metadata = {
  title:
    "Webbyrå Jönköping | Webbdesign & SEO",

  description:
    "Webbyrå för företag i Jönköping. Staark Inc. hjälper med webbdesign, webbutveckling, SEO och snabba moderna webbplatser.",

  alternates: {
    canonical: "/webbyra-jonkoping",
  },

  openGraph: {
    title:
      "Webbyrå Jönköping | Staark Inc.",

    description:
      "Webbdesign, utveckling och SEO för företag i Jönköping.",

    url:
      "/webbyra-jonkoping",

    type:
      "website",
  },
};

export default function Page() {
  return (
    <LocalLandingPage
      city="Jönköping"
      canonicalPath="/webbyra-jonkoping"

      title="Webbyrå i Jönköping för företag som vill växa."

      description="Vi hjälper företag i Jönköping att skapa moderna, snabba och tydliga webbplatser som fungerar lika bra på mobil som på dator."

      localTitle="En webbplats byggd för ditt företag – inte bara för att se bra ut."

      localDescription="För företag i Jönköping kan webbplatsen vara en viktig del av både försäljning och första intryck. Vi bygger lösningar med tydlig struktur, bra prestanda och en teknisk grund som gör det enklare för både kunder och sökmotorer att hitta rätt."

      localPoints={[
        "Webbdesign anpassad efter verksamheten",
        "Lokal SEO för bättre synlighet",
        "Snabb och mobilanpassad webbplats",
        "Personlig kontakt genom hela projektet",
      ]}
    />
  );
}