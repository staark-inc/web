export type Project = {
  slug: string;
  title: string;
  category: string;
  description: string;
  image: string;
  tags: string[];
  services: string[];
  challenge: string;
  solution: string;
  result: string;
};

export const projects: Project[] = [
  {
    slug: "alex-dackservice",

    title: "Alex Däckservice",

    category:
      "Webbdesign & webbutveckling",

    description:
      "En modern och mobilanpassad webbplats som gör det enklare för kunder att förstå tjänsterna och komma i kontakt med företaget.",

    image:
      "/figma-v2/project-1.png",

    tags: [
      "Webbdesign",
      "Webbutveckling",
      "SEO",
      "Mobilanpassning",
    ],

    services: [
      "Webbdesign",
      "Webbutveckling",
      "SEO",
      "Mobilanpassning",
    ],

    challenge:
      "Alex Däckservice behövde en tydligare och mer professionell digital närvaro där kunder snabbt kan förstå företagets tjänster, hitta rätt information och enkelt ta nästa steg.",

    solution:
      "Vi skapade en modern och responsiv webbplats med tydlig informationsstruktur, enkel navigation och fokus på mobil användarupplevelse, prestanda och sökmotorvänlig struktur.",

    result:
      "Resultatet är en snabb och lättanvänd webbplats som presenterar företaget professionellt och gör det enklare för potentiella kunder att hitta information och ta kontakt.",
  },

  {
    slug: "staark-hub",

    title: "Staark Hub",

    category:
      "CRM & intern plattform",

    description:
      "En intern plattform för att hantera leads, kunder, e-postkonversationer och arbetsflöden på ett och samma ställe.",

    image:
      "/figma-v2/staark-hub.png",

    tags: [
      "CRM",
      "Next.js",
      "Gmail API",
      "PostgreSQL",
      "Automation",
      "UI/UX",
    ],

    services: [
      "Webbutveckling",
      "Systemutveckling",
      "UI/UX",
      "API-integration",
      "Automation",
    ],

    challenge:
      "Staark behövde ett enklare sätt att samla leads, kundinformation och e-postkommunikation utan att arbeta i flera separata system.",

    solution:
      "Vi byggde Staark Hub, en intern CRM- och kommunikationsplattform med leadhantering, kundregister, trådade e-postkonversationer, Gmail-synkronisering och automatiserade arbetsflöden.",

    result:
      "Resultatet är ett samlat system där leads, kunder och kommunikation kan hanteras från samma plattform, vilket minskar manuellt arbete och skapar ett tydligare arbetsflöde.",
  },
];

export function getProjectBySlug(
  slug: string
): Project | undefined {
  return projects.find(
    (project) =>
      project.slug === slug
  );
}