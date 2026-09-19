import type { Metadata } from "next";
import LocalLandingPage from "../components/LocalLandingPage";

export const metadata: Metadata = {
  title: "Webbyrå Jönköping | Webbdesign & SEO",
  description:
    "Webbyrå i Jönköping för företag som behöver moderna hemsidor, webbdesign och SEO. Få en kostnadsfri offert från Staark Inc.",

  alternates: {
    canonical: "/webbyra-jonkoping",
  },

  openGraph: {
    title: "Webbyrå Jönköping | Staark Inc.",
    description:
      "Moderna, snabba och SEO-optimerade hemsidor för företag i Jönköping.",
    url: "/webbyra-jonkoping",
    type: "website",
  },
};

export default function Page() {
  return (
    <LocalLandingPage
      city="Jönköping"
      title="Hemsidor som hjälper företag i Jönköping att växa."
      description="Vi bygger moderna, snabba och SEO-optimerade hemsidor för företag i Jönköping."
    />
  );
}