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
    category: "Webbdesign & utveckling",
    description:
      "En modern och responsiv webbplats med fokus på tydlighet, prestanda och enkel kontakt.",
    image: "/figma-v2/project-1.png",

    tags: ["Webbdesign", "Utveckling", "SEO"],

    services: [
      "Webbdesign",
      "Webbutveckling",
      "SEO",
      "Mobilanpassning",
    ],

    challenge:
      "Målet var att skapa en modern och tydlig digital närvaro där besökare snabbt kan förstå företagets tjänster och enkelt ta kontakt.",

    solution:
      "Vi skapade en snabb och responsiv webbplats med tydlig struktur, modern design och fokus på en enkel användarupplevelse.",

    result:
      "Resultatet är en modern webbplats som fungerar lika bra på mobil som på dator och ger företaget en professionell digital närvaro.",
  },

  {
    slug: "projekt-02",
    title: "Projekt 02",
    category: "Webbdesign",
    description:
      "En modern digital lösning med fokus på användarupplevelse och prestanda.",
    image: "/figma-v2/project-2.png",

    tags: ["Webbdesign", "UI/UX"],

    services: [
      "Webbdesign",
      "UI/UX",
      "Responsiv design",
    ],

    challenge:
      "Projektet behövde en tydligare och modernare digital upplevelse.",

    solution:
      "Vi tog fram en ren design med tydlig struktur och responsiv layout.",

    result:
      "En snabb och modern webbplats med bättre användarupplevelse.",
  },

  {
    slug: "projekt-03",
    title: "Projekt 03",
    category: "Webbutveckling",
    description:
      "En snabb och responsiv webbplats skapad för en modern digital närvaro.",
    image: "/figma-v2/project-3.png",

    tags: ["Utveckling", "Webbdesign"],

    services: [
      "Webbutveckling",
      "Prestanda",
      "Mobilanpassning",
    ],

    challenge:
      "Behovet var en snabbare och mer modern webbplats.",

    solution:
      "Vi byggde lösningen med modern teknik och fokus på prestanda.",

    result:
      "En responsiv webbplats med snabb laddning och tydlig struktur.",
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}