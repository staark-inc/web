"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Code2,
  Globe2,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import ContactForm from "./components/ContactForm";

const missionImage =
  "https://www.figma.com/api/mcp/asset/3c5dfa1c-a673-467f-a70a-d03aa856b1.png";

const services = [
  ["Webbdesign & Utveckling", "Vi bygger moderna, snabba webbplatser med Next.js och React", Code2],
  ["SEO & Synlighet", "Vi optimerar din webbplats så att lokala kunder hittar dig på Google", Search],
  ["Underhåll & Support", "Löpande uppdateringar, säkerhetskopiering och teknisk support", ShieldCheck],
  ["Hosting & Drift", "Snabb och säker hosting med 99.9% upptid", Globe2],
] as const;

const faqs = [
  ["Hur lång tid tar det att bygga en webbplats?", "De flesta webbplatser är redo att lanseras inom 2–4 veckor efter att vi fått allt material."],
  ["Vad kostar en webbplats?", "Våra paket börjar på 2 999 SEK. Vi ger alltid en tydlig offert innan vi börjar."],
  ["Behöver jag köpa hosting separat?", "Nej. Alla våra paket inkluderar sex månaders gratis hosting och därefter ett enkelt månadspris."],
  ["Kan ni hjälpa till med texter och bilder?", "Absolut. Vi hjälper gärna till att strukturera innehållet och rekommenderar rätt material för din verksamhet."],
] as const;

const packages = [
  { name: "Starter", price: "2 999 SEK", features: ["Enkel webbplats (upp till 5 sidor)", "6 månaders gratis hosting", "Grundläggande SEO", "Responsiv design", "E-postsupport"] },
  { name: "Professionell", price: "5 999 SEK", featured: true, features: ["Webbplats upp till 15 sidor", "6 månaders gratis hosting", "Avancerad SEO-optimering", "Kontaktformulär & Google Maps", "Prioriterad support", "Underhåll ingår i 6 månader"] },
  { name: "Företag", price: "9 999 SEK", features: ["Skräddarsydd webbplats", "6 månaders gratis hosting", "Full SEO-optimering", "Avancerade integrationer", "Prioriterad support", "Löpande underhåll"] },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "brand brand-compact" : "brand"}>
      <span className="brand-mark"><Code2 size={compact ? 14 : 18} /></span>
      <strong>Staark Inc{compact ? "." : ""}</strong>
    </div>
  );
}

function BrowserPreview() {
  return (
    <div className="browser-preview">
      <div className="browser-bar">
        <div className="browser-dots"><i /><i /><i /></div>
        <span className="browser-url">brodbracka.se</span>
        <X size={14} />
      </div>
      <div className="browser-body">
        <div className="browser-title"><strong>Bageri Bröd &amp; Bröd</strong><span>━━　━━</span></div>
        <div className="browser-content">
          <div>
            <h3>Hantverksbröd med surdeg, bakat dagligen i stenugn</h3>
            <div className="browser-button" />
          </div>
          <div className="bread-image" />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main>
      <header className="navbar">
        <Brand />
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Öppna meny">
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="/services">Tjänster</a><a href="/process">Hur det fungerar</a><a href="/about">Om oss</a><a href="/pricing">Priser</a><a href="/faq">FAQ</a>
        </nav>
        <a className="button button-light nav-cta" href="/contact">Kontakta oss</a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div>
            <h1>Ditt företag förtjänar en online-närvaro</h1>
            <p>Vi skapar moderna, snabba och Google-optimerade webbplatser för småföretag i Jönköping och Värnamo. Inga dolda kostnader, rakt på sak och anpassat till din budget.</p>
          </div>
          <div className="hero-actions"><a className="button button-primary" href="#contact">Begär offert</a><a className="phone-link" href="tel:+46722000000"><Phone size={20} /> +46 72 200 00 00</a></div>
          <div className="trust-row"><div className="avatars"><span /><span /><span /></div><small>Vi stödjer bagerier, mottagningar, verkstäder och lokala entreprenörer.</small></div>
        </div>
        <BrowserPreview />
      </section>

      <section className="section section-white" id="services">
        <SectionHeading eyebrow="Vad vi erbjuder" title="Allt ditt företag behöver för att växa online" description="En enkel, ren och effektiv webbplats. Vi tar hand om den tekniska komplexiteten så att du kan fokusera på det du gör bäst." />
        <div className="service-grid">{services.map(([title, description, Icon]) => <article className="service-card" key={title}><span className="icon-box"><Icon size={20} /></span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div>
      </section>

      <section className="section" id="process">
        <SectionHeading eyebrow="Vår process" title="Från idé till färdig webbplats på bara tre enkla steg" description="Vi har förenklat hela utvecklingsprocessen för att spara din tid. Du bidrar med berättelsen, vi bidrar med den digitala närvaron." />
        <div className="steps">{[["01", "Kontakta oss", "Fyll i formuläret på webben eller ring oss direkt. Berätta kort om din verksamhet."], ["02", "Vi diskuterar dina behov", "Vi bestämmer tillsammans vilka sidor som behövs, texter, kontaktuppgifter och relevanta bilder för ditt företag."], ["03", "Du får din färdiga webbplats", "Vi skriver koden, optimerar plattformen och sätter den live. Du är redo att ta emot dina första kunder online."]].map(([number, title, description]) => <article className="step-card" key={number}><strong>{number}</strong><div><h3>{title}</h3><p>{description}</p></div></article>)}</div>
      </section>

      <section className="section section-bordered">
        <SectionHeading eyebrow="Företag vi samarbetar med" title="Våra samarbetspartners" description="Vi samarbetar med lokala och nationella aktörer för att leverera stabila och moderna digitala lösningar." />
        <div className="partners"><div className="partner"><span>AS</span><strong>Alexdack Service</strong><small>alexdack.se</small></div><div className="partner"><span>TI</span><strong>TutorialeIPS</strong><small>tutorialeips.ro</small></div></div>
      </section>

      <section className="about section-white" id="about">
        <img src={missionImage} alt="Hantverkare i en lokal verkstad" />
        <div><SectionHeading eyebrow="Om oss" title="Vår mission: Digitalisera lokala företag i Jönköping och Värnamo" /><div className="about-copy"><p>Vi är ett dedikerat team av utvecklare och designers som brinner för att hjälpa småföretagare ta steget online. Vi vet att ett lokalt bageri, en snickeriverkstad, en tandläkarmottagning eller ett familjepensionat inte behöver enorma budgetar eller komplicerade webbstrukturer för att lyckas.</p><p>Staark Inc. är skapad för att möta just de här behoven: rena, snabba och ekonomiskt tillgängliga lösningar med samma tekniska krav som stora SaaS-företag.</p></div><div className="tech"><strong>MODERNA TEKNIKER VI ANVÄNDER</strong><div><span>Next.js</span><span>React</span><span>Tailwind CSS</span><span>Vercel</span></div></div></div>
      </section>

      <section className="pricing" id="pricing">
        <div className="pricing-panel"><span className="promo">Kampanjpris - Begränsat erbjudande!</span><strong className="pricing-eyebrow">Våra paket</strong><h2>Hitta rätt paket för ditt företag</h2><p>Välj det paket som passar din verksamhet. Alla paket inkluderar 6 månaders kostnadsfri hosting.</p><div className="package-grid">{packages.map((item) => <article className={item.featured ? "package featured" : "package"} key={item.name}>{item.featured && <span className="popular">Populärast</span>}<div><small>{item.name}</small><h3>{item.price}</h3></div><ul>{item.features.map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul><a className={item.featured ? "button button-primary" : "button button-light"} href="#contact">Välj {item.name}</a></article>)}</div></div>
      </section>

      <section className="faq section section-white"><SectionHeading eyebrow="Vanliga frågor" title="Vanliga frågor om våra webbplatser" /><div className="faq-list">{faqs.map(([question, answer], index) => <div className="faq-item" key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{question}</span><ChevronDown className={openFaq === index ? "rotate" : ""} size={18} /></button>{openFaq === index && <p>{answer}</p>}</div>)}</div></section>

      <section className="contact section-white" id="contact"><div className="contact-copy"><SectionHeading eyebrow="Kontakta oss" title="Låt oss prata om din framtida webbplats" description="Vi finns här för att svara på alla dina frågor om priser, tider och teknisk process. Fyll i formuläret eller kontakta oss direkt." /><div className="contact-details"><a href="mailto:contact@staarkinc.com"><Mail size={20} /><span>Skicka ett mejl till<strong>contact@staarkinc.com</strong></span></a><a href="tel:+46722000000"><Phone size={20} /><span>Ring oss direkt på<strong>+46 72 200 00 00</strong></span></a><span><MapPin size={20} /><span>Kontor<strong>Jönköping och Värnamo, Sverige</strong></span></span></div></div><ContactForm /></section>

      <footer><div className="footer-top"><div className="footer-about"><Brand compact /><p>Vi skapar rena och snabba webbplatser för lokala företag i Jönköping och Värnamo, med modern teknik där det verkligen gör skillnad.</p></div><div className="footer-links"><div><strong>Tjänster</strong><a href="#services">Anpassad Design</a><a href="#services">SEO-optimering</a><a href="#services">Responsiv Webbplats</a><a href="#services">Dedikerat Support</a></div><div><strong>Team</strong><a href="#about">Om oss</a><a href="#contact">Kontakta oss</a><a href="#faq">Vanliga frågor</a></div><div><strong>Sociala medier</strong><a href="#contact">Facebook</a><a href="#contact">Instagram</a><a href="#contact">LinkedIn</a></div></div></div><div className="footer-bottom"><span>© 2026 Staark Inc. Alla rättigheter förbehållna.</span><span>Byggt med: <strong>React • Next.js • Tailwind</strong></span></div></footer>
    </main>
  );
}
