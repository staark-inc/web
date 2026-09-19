export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime: string;
  featured?: boolean;
  image?: string;

  content: {
    heading?: string;
    paragraphs?: string[];
    list?: string[];
  }[];
};

export const posts: BlogPost[] = [
  {
    slug: "vad-kostar-en-hemsida",
    title: "Vad kostar en hemsida för företag?",
    description:
      "Vad kostar det att bygga en hemsida? Vi går igenom vad som påverkar priset och vad småföretag bör tänka på innan de beställer en ny webbplats.",
    category: "Webbdesign",
    publishedAt: "2026-09-19",
    readingTime: "5 min",
    featured: true,

    content: [
      {
        paragraphs: [
          "Priset på en hemsida kan variera mycket beroende på företagets behov. En mindre webbplats med några få sidor kostar normalt mindre än en skräddarsydd lösning med bokningssystem, integrationer eller e-handel.",
          "Det viktigaste är därför inte bara att fråga vad en hemsida kostar, utan också vad företaget faktiskt behöver.",
        ],
      },
      {
        heading: "Vad påverkar priset på en hemsida?",
        paragraphs: [
          "Flera saker påverkar hur mycket arbete som krävs för att designa och utveckla en webbplats.",
        ],
        list: [
          "Antalet sidor",
          "Webbdesign och grafisk profil",
          "Specialfunktioner och integrationer",
          "SEO och innehåll",
          "Kontaktformulär eller bokningsfunktioner",
          "E-handel",
          "Support och underhåll",
        ],
      },
      {
        heading: "En enklare hemsida",
        paragraphs: [
          "För ett mindre företag kan en enkel webbplats ofta vara tillräcklig. Det viktigaste är att besökaren snabbt förstår vad företaget erbjuder, var företaget finns och hur man tar kontakt.",
          "Hos Staark Inc. börjar enklare webbprojekt från 2 999 kr.",
        ],
      },
      {
        heading: "Behöver alla företag en avancerad webbplats?",
        paragraphs: [
          "Nej. En webbplats bör anpassas efter verksamheten. Ett lokalt företag som främst behöver presentera sina tjänster och få fler kontaktförfrågningar har andra behov än en webbutik eller en större digital tjänst.",
          "Det är ofta bättre att börja med rätt funktioner och bygga vidare när behovet växer.",
        ],
      },
      {
        heading: "Be om en tydlig offert",
        paragraphs: [
          "Innan ett webbprojekt börjar bör det vara tydligt vad som ingår i priset. Det gör det enklare att jämföra lösningar och minskar risken för oväntade kostnader senare.",
        ],
      },
    ],
  },

  {
    slug: "seo-for-smaforetag",
    title: "SEO för småföretag – en enkel guide",
    description:
      "En introduktion till SEO för småföretag och vad du kan göra för att hjälpa fler potentiella kunder att hitta ditt företag via Google.",
    category: "SEO",
    publishedAt: "2026-09-19",
    readingTime: "6 min",

    content: [
      {
        paragraphs: [
          "SEO handlar om att göra det enklare för sökmotorer och människor att förstå vad din webbplats handlar om.",
          "För ett mindre eller lokalt företag kan bra SEO hjälpa potentiella kunder att hitta verksamheten när de söker efter en tjänst i sitt område.",
        ],
      },
      {
        heading: "Börja med tydligt innehåll",
        paragraphs: [
          "Varje viktig sida på webbplatsen bör tydligt beskriva vilken tjänst företaget erbjuder. Rubriker och texter ska framför allt vara skrivna för besökaren, men samtidigt hjälpa sökmotorer att förstå sidans innehåll.",
        ],
      },
      {
        heading: "Lokal SEO",
        paragraphs: [
          "För lokala företag är det viktigt att webbplatsen tydligt visar vilka områden verksamheten arbetar i.",
          "Ett företag som arbetar i exempelvis Jönköping, Värnamo eller Vaggeryd kan skapa relevant innehåll som beskriver tjänsterna och kopplingen till respektive område.",
        ],
      },
      {
        heading: "Tekniken spelar också roll",
        paragraphs: [
          "SEO handlar inte bara om text. Webbplatsen behöver också fungera bra tekniskt.",
        ],
        list: [
          "Snabb laddning",
          "Mobilanpassning",
          "Tydliga sidtitlar",
          "Bra URL-struktur",
          "Interna länkar",
          "Sitemap",
          "Säkra HTTPS-anslutningar",
        ],
      },
      {
        heading: "SEO tar tid",
        paragraphs: [
          "SEO är normalt ett långsiktigt arbete. En bra teknisk grund och relevant innehåll gör det möjligt att fortsätta förbättra webbplatsens synlighet över tid.",
        ],
      },
    ],
  },

  {
    slug: "webbdesign-for-smaforetag",
    title: "Webbdesign för småföretag – vad är viktigast?",
    description:
      "Fem viktiga saker att tänka på när du bygger eller beställer en webbplats för ett mindre företag.",
    category: "Webbdesign",
    publishedAt: "2026-09-19",
    readingTime: "5 min",

    content: [
      {
        paragraphs: [
          "En företagswebbplats behöver inte vara komplicerad för att fungera bra. För många småföretag är tydlighet viktigare än mängden funktioner.",
          "Besökaren ska snabbt kunna förstå vad företaget erbjuder och hur man tar nästa steg.",
        ],
      },
      {
        heading: "1. Ett tydligt första intryck",
        paragraphs: [
          "Den första delen av webbplatsen bör snabbt förklara vad företaget gör. Undvik långa introduktioner som gör att besökaren måste leta efter informationen.",
        ],
      },
      {
        heading: "2. Mobilanpassning",
        paragraphs: [
          "Webbplatsen behöver fungera på olika skärmstorlekar. Text, navigation, knappar och formulär ska vara enkla att använda även på en mindre skärm.",
        ],
      },
      {
        heading: "3. Bra prestanda",
        paragraphs: [
          "Stora bilder, onödiga skript och dålig teknisk optimering kan göra en webbplats långsam. En snabbare webbplats ger besökaren en bättre upplevelse.",
        ],
      },
      {
        heading: "4. Tydliga kontaktvägar",
        paragraphs: [
          "Om målet är att få nya kunder behöver det vara enkelt att kontakta företaget. Kontaktformulär, e-post och tydliga knappar bör finnas där de är relevanta.",
        ],
      },
      {
        heading: "5. Bygg för framtiden",
        paragraphs: [
          "En webbplats bör kunna utvecklas när företaget växer. Därför är en tydlig struktur och en modern teknisk grund värdefull redan från början.",
        ],
      },
    ],
  },
];

export function getPostBySlug(
  slug: string
): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}