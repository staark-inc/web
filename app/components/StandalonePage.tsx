import { Mail, MapPin, Phone } from "lucide-react";
import { StandaloneLayout } from "./SiteChrome";
import ContactForm from "./ContactForm";
import StandaloneFaqItem from "./StandaloneFaqItem";

const faqs = [
  ["Hur lång tid tar det att bygga en webbplats?", "De flesta webbplatser är redo att lanseras inom 2–4 veckor efter att vi fått allt material."],
  ["Vad kostar en webbplats?", "Våra paket börjar på 2 999 SEK. Vi ger alltid en tydlig offert innan vi börjar."],
  ["Behöver jag köpa hosting separat?", "Nej. Alla våra paket inkluderar sex månaders gratis hosting och därefter ett enkelt månadspris."],
  ["Kan ni hjälpa till med texter och bilder?", "Absolut. Vi hjälper gärna till att strukturera innehållet och rekommenderar rätt material för din verksamhet."],
] as const;

const serviceItems = [
  ["Webbdesign & Utveckling", "Vi bygger moderna, snabba webbplatser med Next.js och React", "/icon-layout.svg"],
  ["SEO & Synlighet", "Vi optimerar din webbplats så att lokala kunder hittar dig på Google", "/icon-search.svg"],
  ["Underhåll & Support", "Löpande uppdateringar, säkerhetskopiering och teknisk support", "/icon-smartphone.svg"],
  ["Hosting & Drift", "Snabb och säker hosting med 99.9% upptid", "/icon-help-circle.svg"],
] as const;

function Heading({ label, title, text }: { label: string; title: string; text: string }) {
  return <div className="section-heading"><span className="eyebrow">{label}</span><h1>{title}</h1><p>{text}</p></div>;
}

export default function StandalonePage({ type }: { type: "about" | "services" | "process" | "pricing" | "faq" | "contact" }) {
  if (type === "about") return <StandaloneLayout><section className="about standalone section-white"><div className="mission-art" /><div><Heading label="Om oss" title="Vår mission: Digitalisera lokala företag i Jönköping och Värnamo" text="Vi hjälper småföretagare att ta steget online med rena, snabba och ekonomiskt tillgängliga lösningar." /><div className="about-copy"><p>Vi är ett dedikerat team av utvecklare och designers som brinner för att hjälpa småföretagare ta steget online. Ett lokalt bageri, en verkstad eller en mottagning behöver inte en enorm budget för att lyckas digitalt.</p><p>Staark Inc. kombinerar modern teknik med personlig service och tydliga priser.</p></div><div className="tech"><strong>MODERNA TEKNIKER VI ANVÄNDER</strong><div><span>Next.js</span><span>React</span><span>Tailwind CSS</span><span>Vercel</span></div></div></div></section></StandaloneLayout>;
  if (type === "services") return <StandaloneLayout><section className="section standalone-section section-white"><Heading label="Vad vi erbjuder" title="Allt ditt företag behöver för att växa online" text="En enkel, ren och effektiv webbplats. Vi tar hand om den tekniska komplexiteten så att du kan fokusera på det du gör bäst." /><div className="service-grid">{serviceItems.map(([title, description, icon]) => <article className="service-card" key={title}><span className="icon-box"><img src={icon} alt="" /></span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></section></StandaloneLayout>;
  if (type === "process") return <StandaloneLayout><section className="section standalone-section"><Heading label="Vår process" title="Från idé till färdig webbplats på bara tre enkla steg" text="Du bidrar med berättelsen, vi bidrar med den digitala närvaron." /><div className="steps">{[["01", "Kontakta oss", "Fyll i formuläret eller ring oss direkt."], ["02", "Vi diskuterar dina behov", "Vi bestämmer tillsammans innehåll, sidor och bilder."], ["03", "Du får din färdiga webbplats", "Vi skriver koden, optimerar och sätter sajten live."]].map(([number, title, text]) => <article className="step-card" key={number}><strong>{number}</strong><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section></StandaloneLayout>;
  if (type === "pricing") {
    const pricingPackages = [
      ["Starter", "2 999", ["1-sidig landningssida", "Responsiv design (mobilanpassad)", "Kontaktsida & karta", "6 månaders fri hosting", "Leverans inom 5 arbetsdagar"]],
      ["Professionell", "5 999", ["Upp till 5 undersidor", "Skräddarsydd grafisk profil", "Grundläggande SEO-optimering", "Integrerat kontaktformulär", "6 månaders fri hosting", "Support via e-post"]],
      ["Företag", "9 999", ["Skräddarsydd flersidig sajt", "Avancerad lokal SEO-satsning", "Blogg eller nyhetsflöde", "6 månaders fri hosting", "Löpande backup & underhåll ingår", "Support dygnet runt"]],
    ] as const;
    return <StandaloneLayout><section className="v2-section v2-pricing v2-pricing-standalone"><div className="v2-section-header centered"><span>Prisplaner</span><h1>Fast pris utan dolda avgifter</h1><p className="v2-pricing-note">Obs: Alla paket inkluderar 6 månaders kostnadsfri hosting.</p></div><div className="v2-package-grid">{pricingPackages.map(([name, price, features], index) => <article className={index === 1 ? "v2-package featured" : "v2-package"} key={name}><div className="v2-package-head"><h3>{name}</h3>{index === 1 && <span>MEST POPULÄR</span>}</div><div className="v2-price"><strong>{price}</strong><small>SEK</small></div><hr /><ul>{features.map((feature) => <li key={feature}><img src="/icon-check.svg" alt="" />{feature}</li>)}</ul><a className={index === 1 ? "v2-button v2-button-primary" : "v2-button v2-button-light"} href="/contact">Välj paket</a></article>)}</div></section></StandaloneLayout>;
  }
  if (type === "faq") return <StandaloneLayout><section className="faq standalone section-white"><Heading label="Vanliga frågor" title="Vanliga frågor om våra webbplatser" text="Răspunsuri clare om proces, prețuri și hosting." /><div className="faq-list">{faqs.map(([question, answer], index) => <StandaloneFaqItem key={question} question={question} answer={answer} index={index} />)}</div></section></StandaloneLayout>;
  return <StandaloneLayout><section className="contact standalone section-white"><div><Heading label="Kontakta oss" title="Låt oss prata om din framtida webbplats" text="Vi svarar på frågor om priser, tider och teknisk process." /><div className="contact-details"><a href="mailto:contact@staarkinc.com"><Mail size={20} /><span>Skicka ett mejl till<strong>contact@staarkinc.com</strong></span></a><a href="tel:+46722000000"><Phone size={20} /><span>Ring oss direkt på<strong>+46 72 200 00 00</strong></span></a><span><MapPin size={20} /><span>Kontor<strong>Jönköping och Värnamo, Sverige</strong></span></span></div></div><ContactForm /></section></StandaloneLayout>;
}
