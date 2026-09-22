export type ContentLink = {
  href: string;
  label: string;
  title: string;
  description: string;
};

const blogRelatedLinks: Record<string, ContentLink[]> = {
  "vad-kostar-en-hemsida": [
    {
      href: "/priser",
      label: "PRISER",
      title: "Se våra priser",
      description:
        "Se startpris, paket och vad som påverkar kostnaden för ett webbprojekt.",
    },
    {
      href: "/tjanster/webbdesign",
      label: "TJÄNST",
      title: "Webbdesign",
      description:
        "Läs hur vi arbetar med tydlig, modern och mobilanpassad webbdesign.",
    },
    {
      href: "/projekt/alex-dackservice",
      label: "PROJEKT",
      title: "Alex Däckservice",
      description:
        "Se ett exempel på hur en tydligare företagswebbplats kan byggas upp.",
    },
  ],
  "seo-for-smaforetag": [
    {
      href: "/tjanster/seo",
      label: "TJÄNST",
      title: "SEO & lokal synlighet",
      description:
        "Teknisk SEO, lokal struktur, metadata och intern länkning för företag.",
    },
    {
      href: "/webbyra-jonkoping",
      label: "LOKALT",
      title: "Webbyrå i Jönköping",
      description:
        "Lokal landningssida för företag som söker webbdesign och SEO i Jönköping.",
    },
    {
      href: "/webbyra-varnamo",
      label: "LOKALT",
      title: "Webbyrå i Värnamo",
      description:
        "Webbdesign, utveckling och lokal SEO för företag i Värnamo.",
    },
  ],
  "webbdesign-for-smaforetag": [
    {
      href: "/tjanster/webbdesign",
      label: "TJÄNST",
      title: "Webbdesign för moderna företag",
      description:
        "Se vad som ingår när vi tar fram en tydligare och mer användbar webbplats.",
    },
    {
      href: "/projekt/alex-dackservice",
      label: "PROJEKT",
      title: "Se ett webbprojekt",
      description:
        "Ett konkret exempel på struktur, mobilanpassning och professionell presentation.",
    },
    {
      href: "/priser",
      label: "PRISER",
      title: "Vad kostar projektet?",
      description:
        "Se vårt startpris och hur omfattning och funktioner påverkar priset.",
    },
  ],
  "lokal-seo-for-foretag": [
    {
      href: "/tjanster/seo",
      label: "TJÄNST",
      title: "SEO som hjälper kunder att hitta dig",
      description:
        "Läs mer om teknisk SEO, lokal synlighet och en tydlig webbstruktur.",
    },
    {
      href: "/webbyra-vaggeryd",
      label: "LOKALT",
      title: "Webbyrå i Vaggeryd",
      description:
        "Ett exempel på hur en lokal sida kan kombinera tjänster, innehåll och sökintention.",
    },
    {
      href: "/kontakt",
      label: "NÄSTA STEG",
      title: "Få hjälp med lokal synlighet",
      description:
        "Berätta vilka tjänster och områden som är viktigast för ditt företag.",
    },
  ],
  "ny-hemsida-eller-forbattra-befintlig": [
    {
      href: "/tjanster/webbutveckling",
      label: "TJÄNST",
      title: "Modern webbutveckling",
      description:
        "Se hur vi arbetar med moderna, responsiva och skalbara webbplatser.",
    },
    {
      href: "/tjanster/prestanda",
      label: "TJÄNST",
      title: "Prestandaoptimering",
      description:
        "Ibland behöver webbplatsen inte byggas om helt – den behöver bli snabbare och effektivare.",
    },
    {
      href: "/projekt",
      label: "PROJEKT",
      title: "Se våra projekt",
      description:
        "Jämför hur olika behov kan lösas med webbdesign, utveckling och system.",
    },
  ],
  "hur-lang-tid-tar-det-att-bygga-en-hemsida": [
    {
      href: "/tjanster/webbdesign",
      label: "TJÄNST",
      title: "Webbdesign",
      description:
        "Design, struktur och innehåll är viktiga delar av tidsplanen.",
    },
    {
      href: "/tjanster/webbutveckling",
      label: "TJÄNST",
      title: "Webbutveckling",
      description:
        "Funktioner och integrationer påverkar hur omfattande utvecklingen blir.",
    },
    {
      href: "/kontakt",
      label: "OFFERT",
      title: "Beskriv ditt projekt",
      description:
        "Skicka en kort beskrivning så kan vi bedöma omfattning och nästa steg.",
    },
  ],
  "webbhotell-support-och-underhall": [
    {
      href: "/tjanster/webbhotell",
      label: "TJÄNST",
      title: "Webbhotell",
      description:
        "Stabil drift, SSL och teknisk hantering för företagets webbplats.",
    },
    {
      href: "/tjanster/support-underhall",
      label: "TJÄNST",
      title: "Support & underhåll",
      description:
        "Löpande hjälp, uppdateringar, felsökning och förbättringar efter lansering.",
    },
    {
      href: "/kontakt",
      label: "KONTAKT",
      title: "Behöver du löpande hjälp?",
      description:
        "Berätta hur webbplatsen driftas idag och vilken hjälp företaget behöver.",
    },
  ],
};

const serviceRelatedGuides: Record<string, ContentLink[]> = {
  webbdesign: [
    {
      href: "/blog/webbdesign-for-smaforetag",
      label: "GUIDE",
      title: "Webbdesign för småföretag",
      description:
        "Fem saker som gör en företagswebbplats tydligare och enklare att använda.",
    },
    {
      href: "/blog/vad-kostar-en-hemsida",
      label: "PRISGUIDE",
      title: "Vad kostar en hemsida?",
      description:
        "Se vilka delar som påverkar priset på ett webbprojekt.",
    },
    {
      href: "/blog/hur-lang-tid-tar-det-att-bygga-en-hemsida",
      label: "PLANERING",
      title: "Hur lång tid tar ett webbprojekt?",
      description:
        "En praktisk genomgång av vad som påverkar tidsplanen.",
    },
  ],
  webbutveckling: [
    {
      href: "/blog/ny-hemsida-eller-forbattra-befintlig",
      label: "GUIDE",
      title: "Ny hemsida eller förbättra den gamla?",
      description:
        "Så kan du bedöma om det är dags för en ombyggnad eller stegvisa förbättringar.",
    },
    {
      href: "/blog/hur-lang-tid-tar-det-att-bygga-en-hemsida",
      label: "PLANERING",
      title: "Hur lång tid tar det?",
      description:
        "Funktioner, innehåll och beslut påverkar projektets omfattning.",
    },
  ],
  seo: [
    {
      href: "/blog/seo-for-smaforetag",
      label: "SEO-GUIDE",
      title: "SEO för småföretag",
      description:
        "En introduktion till teknisk SEO, innehåll och lokal synlighet.",
    },
    {
      href: "/blog/lokal-seo-for-foretag",
      label: "LOKAL SEO",
      title: "Lokal SEO för företag",
      description:
        "Så bygger du tydligare lokala signaler utan att skapa tunt eller duplicerat innehåll.",
    },
  ],
  prestanda: [
    {
      href: "/blog/ny-hemsida-eller-forbattra-befintlig",
      label: "GUIDE",
      title: "Bygga nytt eller förbättra?",
      description:
        "Ibland är prestanda och struktur viktigare än en fullständig ombyggnad.",
    },
    {
      href: "/blog/webbdesign-for-smaforetag",
      label: "WEBBDESIGN",
      title: "Vad är viktigast på en företagswebbplats?",
      description:
        "Prestanda, mobilanpassning och tydlighet påverkar helhetsupplevelsen.",
    },
  ],
  webbhotell: [
    {
      href: "/blog/webbhotell-support-och-underhall",
      label: "GUIDE",
      title: "Webbhotell, support och underhåll",
      description:
        "Vad ett mindre företag faktiskt behöver efter att webbplatsen är lanserad.",
    },
  ],
  "support-underhall": [
    {
      href: "/blog/webbhotell-support-och-underhall",
      label: "GUIDE",
      title: "Support och underhåll efter lansering",
      description:
        "Skillnaden mellan drift, uppdateringar, support och vidareutveckling.",
    },
  ],
};

const projectRelatedLinks: Record<string, ContentLink[]> = {
  "alex-dackservice": [
    {
      href: "/tjanster/webbdesign",
      label: "TJÄNST",
      title: "Webbdesign",
      description:
        "Modern design med fokus på tydlighet, mobil och ett professionellt första intryck.",
    },
    {
      href: "/tjanster/seo",
      label: "TJÄNST",
      title: "SEO",
      description:
        "Teknisk och lokal SEO som hjälper sökmotorer förstå företagets tjänster.",
    },
    {
      href: "/blog/webbdesign-for-smaforetag",
      label: "GUIDE",
      title: "Webbdesign för småföretag",
      description:
        "Läs vilka delar som är viktigast när en mindre företagswebbplats planeras.",
    },
  ],
  "staark-hub": [
    {
      href: "/tjanster/webbutveckling",
      label: "TJÄNST",
      title: "Webbutveckling",
      description:
        "Skräddarsydd utveckling för webbplatser, integrationer och digitala arbetsflöden.",
    },
    {
      href: "/projekt",
      label: "PROJEKT",
      title: "Fler projekt",
      description:
        "Se fler exempel på webbplatser och digitala lösningar byggda av Staark Inc.",
    },
  ],
};

export function getBlogRelatedLinks(slug: string) {
  return blogRelatedLinks[slug] ?? [];
}

export function getServiceRelatedGuides(slug: string) {
  return serviceRelatedGuides[slug] ?? [];
}

export function getProjectRelatedLinks(slug: string) {
  return projectRelatedLinks[slug] ?? [];
}
