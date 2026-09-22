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
  {
    slug: "lokal-seo-for-foretag",
    title: "Lokal SEO för företag – så bygger du bättre synlighet",
    description:
      "En praktisk guide till lokal SEO för företag: tydliga tjänster, lokala landningssidor, intern länkning och innehåll som faktiskt hjälper kunden.",
    category: "SEO",
    publishedAt: "2026-09-22",
    readingTime: "7 min",
    content: [
      {
        paragraphs: [
          "Lokal SEO handlar om att hjälpa sökmotorer förstå vad företaget erbjuder och i vilka områden tjänsterna är relevanta. För kunden handlar det samtidigt om något enklare: att snabbt hitta ett företag som verkar passa behovet.",
          "Bra lokal SEO är därför en kombination av tydlig information, teknisk kvalitet och innehåll som svarar på riktiga frågor.",
        ],
      },
      {
        heading: "Börja med tjänsterna – inte med ortsnamnet",
        paragraphs: [
          "Det räcker inte att skriva samma sida flera gånger och byta ut ortsnamnet. Varje viktig sida behöver förklara tjänsten, målgruppen, processen och nästa steg på ett användbart sätt.",
          "Orten är en relevant signal, men innehållet behöver fortfarande ge besökaren ett tydligt värde.",
        ],
      },
      {
        heading: "Lokala landningssidor behöver vara olika",
        paragraphs: [
          "Om företaget arbetar i flera områden kan separata lokala sidor vara relevanta. De bör däremot inte vara tunna kopior av varandra.",
          "Skillnader kan finnas i sökintention, typ av kund, lokala frågor, erbjudande, vanliga frågor och vilka tjänster som behöver lyftas tydligast.",
        ],
      },
      {
        heading: "Interna länkar hjälper både kunden och Google",
        paragraphs: [
          "En lokal landningssida bör inte vara en återvändsgränd. Länka vidare till relevanta tjänster, priser, projekt, guider och kontakt.",
          "På samma sätt bör tjänstesidor och guider länka tillbaka till de lokala sidor där det är naturligt.",
        ],
      },
      {
        heading: "Tekniska signaler ska vara på plats",
        list: [
          "Unik sidtitel och beskrivning",
          "Canonical till rätt URL",
          "Mobilanpassning",
          "Snabb laddning",
          "Intern länkstruktur",
          "Sitemap",
          "Strukturerad data där den är relevant",
        ],
      },
      {
        heading: "Mät vad som faktiskt händer",
        paragraphs: [
          "När sidorna börjar få data i Google Search Console går det att se vilka sökningar som skapar visningar, vilka sidor som får klick och var det finns potential att förbättra innehållet.",
          "Det är bättre att förbättra utifrån faktisk sökdata än att fylla sidan med fler sökord utan tydligt syfte.",
        ],
      },
    ],
  },

  {
    slug: "ny-hemsida-eller-forbattra-befintlig",
    title: "Ny hemsida eller förbättra den gamla?",
    description:
      "Behöver företaget en helt ny webbplats eller räcker det att förbättra den befintliga? Här är signalerna som hjälper dig välja rätt väg.",
    category: "Webbutveckling",
    publishedAt: "2026-09-22",
    readingTime: "6 min",
    content: [
      {
        paragraphs: [
          "En gammal webbplats behöver inte automatiskt ersättas. Ibland räcker det att förbättra prestanda, innehåll, mobilanpassning eller kontaktvägar.",
          "Men när teknik, struktur och design börjar begränsa företaget kan en ny grund vara både enklare och mer hållbar.",
        ],
      },
      {
        heading: "När förbättringar kan vara rätt",
        list: [
          "Webbplatsen fungerar tekniskt men känns långsam",
          "Innehållet är bra men strukturen är otydlig",
          "Mobilversionen behöver förbättras",
          "Kontaktvägar och call-to-actions är svaga",
          "Metadata och SEO-struktur behöver ses över",
        ],
      },
      {
        heading: "När en ny webbplats kan vara rimligare",
        paragraphs: [
          "Om webbplatsen är svår att underhålla, bygger på en teknisk grund som inte längre passar eller kräver många kompromisser för varje förbättring kan en ombyggnad vara effektivare.",
          "Samma sak gäller när företagets erbjudande, varumärke eller målgrupp har förändrats så mycket att den gamla strukturen inte längre berättar rätt historia.",
        ],
      },
      {
        heading: "Titta på affärsbehovet först",
        paragraphs: [
          "Beslutet bör inte börja med färger eller teknik. Börja med vad webbplatsen ska hjälpa företaget att uppnå.",
          "Ska fler kunder hitta företaget via Google? Ska det bli enklare att boka, begära offert eller förstå olika tjänster?",
        ],
      },
      {
        heading: "Bygg inte om sådant som redan fungerar",
        paragraphs: [
          "En bra genomgång kan visa vilka delar som bör behållas. Värdefullt innehåll, fungerande URL:er och befintlig söktrafik ska hanteras varsamt vid en ombyggnad.",
          "Målet är inte en ny webbplats för sakens skull, utan en bättre lösning för företagets faktiska behov.",
        ],
      },
    ],
  },

  {
    slug: "hur-lang-tid-tar-det-att-bygga-en-hemsida",
    title: "Hur lång tid tar det att bygga en hemsida?",
    description:
      "Hur lång tid tar ett webbprojekt? Vi går igenom vad som påverkar tidsplanen – från innehåll och design till funktioner, feedback och lansering.",
    category: "Webbdesign",
    publishedAt: "2026-09-22",
    readingTime: "6 min",
    content: [
      {
        paragraphs: [
          "Tidsplanen för en webbplats beror framför allt på omfattningen. En mindre företagssida med tydligt innehåll går snabbare att genomföra än ett projekt med många undersidor, integrationer eller specialfunktioner.",
          "Det som ofta tar mest tid är inte själva kodningen, utan beslut, innehåll och feedback mellan olika steg.",
        ],
      },
      {
        heading: "1. Omfattning och antal sidor",
        paragraphs: [
          "Ju fler unika sidtyper och funktioner projektet innehåller, desto mer behöver planeras, designas, byggas och testas.",
        ],
      },
      {
        heading: "2. Innehåll och material",
        paragraphs: [
          "Texter, logotyp, bilder och information om tjänster behöver finnas tillgängliga. Om innehållet saknas behöver projektet också räkna med tid för att ta fram eller strukturera det.",
        ],
      },
      {
        heading: "3. Design och feedback",
        paragraphs: [
          "Tydlig feedback gör stor skillnad. När beslut kan tas löpande blir det enklare att hålla projektet framåt utan onödiga stopp.",
        ],
      },
      {
        heading: "4. Funktioner och integrationer",
        paragraphs: [
          "Kontaktformulär är relativt enkla. Bokningssystem, externa API:er, inloggning, betalningar eller andra skräddarsydda funktioner behöver mer utveckling och testning.",
        ],
      },
      {
        heading: "En bra start sparar tid senare",
        paragraphs: [
          "Ett tydligt projektunderlag behöver inte vara långt. Det räcker ofta att beskriva mål, målgrupp, viktigaste tjänster, önskade funktioner och exempel på webbplatser som känns relevanta.",
          "Ju tydligare målbilden är i början, desto färre onödiga omvägar behövs under projektet.",
        ],
      },
    ],
  },

  {
    slug: "webbhotell-support-och-underhall",
    title: "Webbhotell, support och underhåll – vad behöver företag?",
    description:
      "Vad händer efter lanseringen? Vi förklarar skillnaden mellan webbhotell, teknisk drift, support, underhåll och vidareutveckling.",
    category: "Support",
    publishedAt: "2026-09-22",
    readingTime: "6 min",
    content: [
      {
        paragraphs: [
          "När en webbplats är lanserad behöver den fortfarande en stabil plats att köras på och någon form av teknisk förvaltning. Hur mycket hjälp som behövs varierar mellan företag.",
          "Det är därför bra att skilja på webbhotell, drift, support, underhåll och vidareutveckling.",
        ],
      },
      {
        heading: "Webbhotell och drift",
        paragraphs: [
          "Webbhotell är miljön där webbplatsen körs. För företag är stabilitet, SSL, säker konfiguration och rimlig prestanda viktigare än att bara välja det billigaste alternativet.",
        ],
      },
      {
        heading: "Support",
        paragraphs: [
          "Support handlar om att kunna få hjälp när något inte fungerar eller när företaget behöver vägledning kring webbplatsen.",
          "Det kan vara tekniska frågor, felsökning eller mindre ändringar som behöver göras.",
        ],
      },
      {
        heading: "Underhåll",
        paragraphs: [
          "Underhåll kan omfatta uppdateringar, säkerhetsarbete, kontroll av funktioner och förbättringar som håller webbplatsen stabil över tid.",
        ],
      },
      {
        heading: "Vidareutveckling",
        paragraphs: [
          "När företaget växer kan webbplatsen behöva nya tjänstesidor, integrationer, formulär eller andra funktioner. En bra teknisk grund gör det enklare att utveckla vidare utan att börja om från början.",
        ],
      },
      {
        heading: "Vad behöver ett mindre företag?",
        paragraphs: [
          "För många mindre företag räcker en stabil driftmiljö, SSL, möjlighet till support och en tydlig väg för framtida uppdateringar.",
          "Det viktiga är att veta vem som ansvarar för vad och vad som händer om webbplatsen behöver ändras eller felsökas.",
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