import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staark Platform – webbplats och CRM för företag",
  description: "Samla din webbplats, förfrågningar och kundhantering i Staark Platform. Välj ett paket som passar ditt företag och väx med rätt verktyg.",
  alternates: { canonical: "/saas" },
  openGraph: {
    title: "Staark Platform | Staark Inc.",
    description: "Din webbplats, dina förfrågningar och verktygen för att växa – på ett ställe.",
    url: "/saas",
    type: "website",
  },
};

export default function SaaSLayout({ children }: { children: React.ReactNode }) {
  return children;
}
