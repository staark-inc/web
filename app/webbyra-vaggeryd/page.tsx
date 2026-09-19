import type { Metadata } from "next";
import LocalLandingPage from "../components/LocalLandingPage";

export const metadata: Metadata = {
  title: "Webbyrå Vaggeryd | Webbdesign & SEO",
  description:
    "Webbyrå i Vaggeryd för företag som behöver moderna hemsidor, webbdesign och SEO. Få en kostnadsfri offert från Staark Inc.",

  alternates: {
    canonical: "/webbyra-vaggeryd",
  },

  openGraph: {
    title: "Webbyrå Vaggeryd | Staark Inc.",
    description:
      "Moderna, snabba och SEO-optimerade hemsidor för företag i Vaggeryd.",
    url: "/webbyra-vaggeryd",
    type: "website",
  },
};

export default function Page() {
  return (
    <LocalLandingPage
      city="Vaggeryd"
      title="Hemsidor som hjälper företag i Vaggeryd att växa."
      description="Vi bygger moderna, snabba och SEO-optimerade hemsidor för företag i Vaggeryd."
    />
  );
}