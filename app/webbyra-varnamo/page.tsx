import type { Metadata } from "next";
import LocalLandingPage from "../components/LocalLandingPage";

export const metadata: Metadata = {
  title: "Webbyrå Värnamo | Webbdesign & SEO",
  description:
    "Webbyrå i Värnamo för företag som behöver moderna hemsidor, webbdesign och SEO. Få en kostnadsfri offert från Staark Inc.",

  alternates: {
    canonical: "/webbyra-varnamo",
  },

  openGraph: {
    title: "Webbyrå Värnamo | Staark Inc.",
    description:
      "Moderna, snabba och SEO-optimerade hemsidor för företag i Värnamo.",
    url: "/webbyra-varnamo",
    type: "website",
  },
};

export default function Page() {
  return (
    <LocalLandingPage
      city="Värnamo"
      title="Hemsidor som hjälper företag i Värnamo att växa."
      description="Vi bygger moderna, snabba och SEO-optimerade hemsidor för företag i Värnamo."
    />
  );
}