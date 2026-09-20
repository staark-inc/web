import type { Metadata } from "next";

import LocalLandingPage from "../components/LocalLandingPage";

export const metadata: Metadata = {
  title:
    "Webbyrå Värnamo | Webbdesign & SEO",

  description:
    "Webbdesign, webbutveckling och SEO för företag i Värnamo. Staark Inc. bygger moderna webbplatser med fokus på synlighet och prestanda.",

  alternates: {
    canonical: "/webbyra-varnamo",
  },

  openGraph: {
    title:
      "Webbyrå Värnamo | Staark Inc.",

    description:
      "Webbdesign, webbutveckling och SEO för företag i Värnamo.",

    url:
      "/webbyra-varnamo",

    type:
      "website",
  },
};

export default function Page() {
  return (
    <LocalLandingPage
      city="Värnamo"

      title="Webbplatser för företag som vill synas bättre i Värnamo."

      description="Vi hjälper företag i Värnamo med webbdesign, utveckling och SEO för att skapa en snabbare, tydligare och mer professionell digital närvaro."

      localTitle="Mer än en snygg hemsida."

      localDescription="Webbplatsen ska hjälpa besökaren att förstå ditt företag och enkelt ta nästa steg. Därför kombinerar vi design, prestanda och en SEO-vänlig struktur för att skapa en webbplats som både ser professionell ut och fungerar i praktiken."

      localPoints={[
        "Modern och professionell webbdesign",
        "Lokal SEO och bättre digital synlighet",
        "Snabb och mobilanpassad webbplats",
        "Lösningar som kan utvecklas över tid",
      ]}
    />
  );
}