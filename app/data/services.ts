export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  intro: string;
  benefits: string[];
  includes: string[];
};

export const services: Service[] = [
  {
    slug: "webbdesign",
    title: "Webbdesign för moderna företag",
    shortTitle: "Webbdesign",
    description:
      "Modern och responsiv webbdesign som hjälper ditt företag att skapa ett professionellt första intryck.",
    intro:
      "Vi designar moderna webbplatser med fokus på tydlighet, användarupplevelse och ditt företags identitet. Designen anpassas för både mobil, surfplatta och dator.",
    benefits: [
      "Professionellt första intryck",
      "Mobilanpassad design",
      "Tydlig användarupplevelse",
      "Design anpassad efter ditt företag",
    ],
    includes: [
      "Responsiv webbdesign",
      "UI/UX",
      "Design för mobil och desktop",
      "Tydliga call-to-actions",
      "Modern layout",
    ],
  },

  {
    slug: "webbutveckling",
    title: "Modern webbutveckling",
    shortTitle: "Webbutveckling",
    description:
      "Snabba och moderna webbplatser byggda med teknik anpassad efter ditt företags behov.",
    intro:
      "Vi utvecklar moderna webbplatser med fokus på prestanda, stabilitet och en bra användarupplevelse.",
    benefits: [
      "Snabb webbplats",
      "Modern teknik",
      "Skalbar lösning",
      "Responsiv på alla enheter",
    ],
    includes: [
      "Frontend-utveckling",
      "Next.js & React",
      "Responsiv utveckling",
      "Integrationer",
      "Teknisk optimering",
    ],
  },

  {
    slug: "seo",
    title: "SEO som hjälper kunder att hitta dig",
    shortTitle: "SEO",
    description:
      "SEO och lokal sökmotoroptimering för företag som vill förbättra sin synlighet på Google.",
    intro:
      "Vi hjälper till att skapa en tekniskt SEO-vänlig webbplats och en tydlig struktur som gör det enklare för sökmotorer att förstå ditt innehåll.",
    benefits: [
      "Bättre teknisk grund",
      "Lokal synlighet",
      "SEO-vänlig struktur",
      "Optimerat innehåll",
    ],
    includes: [
      "Teknisk SEO",
      "Lokal SEO",
      "Metadata",
      "Sitemap",
      "Intern länkstruktur",
    ],
  },

  {
    slug: "prestanda",
    title: "Snabbare webbplatser med bättre prestanda",
    shortTitle: "Prestanda",
    description:
      "Prestandaoptimering för snabbare laddning och en bättre användarupplevelse.",
    intro:
      "En snabb webbplats är bättre för både besökare och sökmotorer. Vi optimerar kod, bilder och andra delar som påverkar laddningstiden.",
    benefits: [
      "Snabbare laddning",
      "Bättre användarupplevelse",
      "Mobiloptimering",
      "Effektivare webbplats",
    ],
    includes: [
      "Bildoptimering",
      "Kodoptimering",
      "Core Web Vitals",
      "Caching",
      "Prestandaanalys",
    ],
  },

  {
    slug: "webbhotell",
    title: "Webbhotell för din webbplats",
    shortTitle: "Webbhotell",
    description:
      "Stabil drift och teknisk hantering för företagets webbplats.",
    intro:
      "Vi hjälper dig med en stabil teknisk miljö så att webbplatsen kan vara tillgänglig, säker och snabb.",
    benefits: [
      "Stabil drift",
      "SSL",
      "Teknisk hantering",
      "Support",
    ],
    includes: [
      "Hosting",
      "SSL-certifikat",
      "Drift",
      "Grundläggande övervakning",
      "Teknisk support",
    ],
  },

  {
    slug: "support-underhall",
    title: "Support & underhåll för din webbplats",
    shortTitle: "Support & underhåll",
    description:
      "Löpande hjälp, uppdateringar och förbättringar för din webbplats.",
    intro:
      "En webbplats behöver ibland uppdateras och förbättras. Vi kan hjälpa till även efter lanseringen.",
    benefits: [
      "Personlig support",
      "Löpande uppdateringar",
      "Teknisk hjälp",
      "Förbättringar över tid",
    ],
    includes: [
      "Uppdateringar",
      "Felsökning",
      "Mindre ändringar",
      "Teknisk support",
      "Löpande förbättringar",
    ],
  },
];

export function getServiceBySlug(slug: string) {
  return services.find((service) => service.slug === slug);
}