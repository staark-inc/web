"use client";

import { useState } from "react";
import { ChevronDown, Code2, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import ContactForm from "./components/ContactForm";

const services = [
  ["Webbdesign & Utveckling", "Vi bygger moderna, snabba och konverterande webbplatser.", "/icon-layout.svg"],
  ["SEO & Synlighet", "Vi hjälper dina kunder att hitta dig på Google.", "/icon-search.svg"],
  ["Underhåll & Support", "Vi håller din webbplats uppdaterad, säker och snabb.", "/icon-smartphone.svg"],
  ["Hosting & Drift", "Snabb och säker hosting med 99,9% upptid.", "/icon-help-circle.svg"],
] as const;

const projects = [
  ["Bageri Solsken", "Starter Paket", "En mysig, lokalproducerad känsla med integrerad beställningsfunktion för bröd och tårtor.", "/figma-v2/project-1.png"],
  ["AutoFix Värnamo", "Professionell", "En modern bilverkstadssajt med fokus på snabb tidsbokning och tydlig prislista för service.", "/figma-v2/project-2.png"],
  ["Café Strömsund", "Företag", "Stilren design med stor bildyta, dynamisk meny och sociala medier-flöde integrerat direkt.", "/figma-v2/project-3.png"],
] as const;

const packages = [
  { name: "Starter", price: "2 999", featured: false, features: ["Enkel webbplats", "Upp till 3 undersidor", "Grundläggande SEO", "6 månaders fri hosting", "Leverans inom 5 arbetsdagar"] },
  { name: "Professionell", price: "5 999", featured: true, features: ["Upp till 5 undersidor", "Skräddarsydd grafisk profil", "Grundläggande SEO-optimering", "Integrerat kontaktformulär", "6 månaders fri hosting", "Support via e-post"] },
  { name: "Företag", price: "9 999", featured: false, features: ["Skräddarsydd webbplats", "Obegränsat antal sidor", "Full SEO-strategi", "E-handelsfunktioner", "Löpande backup & underhåll ingår", "Dedikerad projektledare"] },
] as const;

const faqs = [
  ["Hur lång tid tar det att bygga en webbplats?", "De flesta webbplatser är redo att lanseras inom 2–4 veckor efter att vi fått allt material."],
  ["Vad kostar en webbplats?", "Våra paket börjar på 2 999 SEK. Vi ger alltid en tydlig offert innan vi börjar."],
  ["Behöver jag köpa hosting separat?", "Nej. Alla våra paket inkluderar sex månaders fri hosting."],
  ["Kan ni hjälpa till med texter och bilder?", "Absolut. Vi hjälper gärna till att strukturera innehållet och rekommenderar rätt material."],
] as const;

function Brand() {
  return <Link className="v2-brand" href="/" aria-label="Staark startsida">STAARK<span /></Link>;
}

function SectionHeader({ eyebrow, title, description, centered = false }: { eyebrow: string; title: string; description?: string; centered?: boolean }) {
  return <div className={centered ? "v2-section-header centered" : "v2-section-header"}><span>{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>;
}

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return <div className="v2-faq-item"><button onClick={() => setOpen(!open)} aria-expanded={open}><span>{question}</span><ChevronDown size={20} className={open ? "rotate" : ""} /></button>{open && <p>{answer}</p>}</div>;
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="v2-page">
      <header className="v2-navbar">
        <Brand />
        <button className="v2-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="v2-navigation" aria-label="Öppna meny">{menuOpen ? <X /> : <Menu />}</button>
        <nav id="v2-navigation" className={menuOpen ? "v2-nav open" : "v2-nav"}>
          <a href="#services" onClick={closeMenu}>Tjänster</a><a href="#portfolio" onClick={closeMenu}>Portfolio</a><a href="#pricing" onClick={closeMenu}>Priser</a><a href="#about" onClick={closeMenu}>Om Oss</a><a href="#faq" onClick={closeMenu}>FAQ</a><a href="#contact" onClick={closeMenu}>Kontakt</a>
        </nav>
        <a className="v2-button v2-button-primary v2-nav-button" href="#contact">Boka samtal</a>
      </header>

      <section className="v2-hero">
        <div className="v2-hero-copy"><span className="v2-pill">Webbyrå i Jönköping &amp; Värnamo</span><h1>Vi bygger webbplatser som växer ditt företag</h1><p>Professionella, snabba och prisvärda hemsidor skräddarsydda för småföretagare i Småland. Låt oss sätta ditt företag på kartan online.</p></div>
        <div className="v2-actions"><a className="v2-button v2-button-primary" href="#pricing">Se våra paket</a><a className="v2-button v2-button-outline" href="#contact">Boka gratis konsultation</a></div>
      </section>

      <section className="v2-proof"><div><strong>50+</strong><span>Webbplatser lanserade</span></div><div><strong>99,9%</strong><span>Kundnöjdhet</span></div><div><strong>4,8/5</strong><span>Genomsnittligt betyg</span></div></section>

      <section className="v2-section v2-services" id="services"><SectionHeader eyebrow="Vad vi erbjuder" title="Allt ditt småföretag behöver för att lyckas digitalt" description="Vi tar hand om tekniken så att du kan fokusera på att driva ditt företag." /><div className="v2-service-grid">{services.map(([title, description, icon]) => <article className="v2-service-card" key={title}><span className="v2-icon"><img src={icon} alt="" /></span><h3>{title}</h3><p>{description}</p></article>)}</div></section>

      <section className="v2-section v2-portfolio" id="portfolio"><SectionHeader eyebrow="Våra projekt" title="Projekt vi är stolta över" description="Se hur vi har hjälpt andra småföretag att växa med en stark digital närvaro." /><div className="v2-project-grid">{projects.map(([name, tier, description, image]) => <article className="v2-project" key={name}><img src={image} alt="" /><div><span>{tier}</span><h3>{name}</h3><p>{description}</p></div></article>)}</div></section>

      <section className="v2-section v2-process"><SectionHeader eyebrow="Processen" title="Från idé till färdig hemsida" centered /><div className="v2-process-grid">{[["01", "Berätta om ditt företag", "Vi börjar med ett kort samtal om dina mål, kunder och behov."], ["02", "Vi bygger tillsammans", "Du får se framstegen och ge feedback under hela processen."], ["03", "Få fler kunder online", "Din nya webbplats lanseras och börjar arbeta för ditt företag."]].map(([number, title, description]) => <article key={number}><strong>{number}</strong><h3>{title}</h3><p>{description}</p></article>)}</div></section>

      <section className="v2-section v2-pricing" id="pricing"><SectionHeader eyebrow="Våra paket" title="Enkla priser, tydliga resultat" description="Välj det paket som passar ditt företag. Inga dolda kostnader eller överraskningar." centered /><div className="v2-package-grid">{packages.map((item) => <article className={item.featured ? "v2-package featured" : "v2-package"} key={item.name}><div className="v2-package-head"><h3>{item.name}</h3>{item.featured && <span>Mest Populär</span>}</div><div className="v2-price"><strong>{item.price}</strong><small>SEK</small></div><hr /><ul>{item.features.map((feature) => <li key={feature}><img src="/icon-check.svg" alt="" />{feature}</li>)}</ul><a className={item.featured ? "v2-button v2-button-primary" : "v2-button v2-button-light"} href="#contact">Välj paket</a></article>)}</div></section>

      <section className="v2-partners"><strong>Företag som litar på oss</strong><div><span>Alexdack Service</span><span>TutorialeIPS</span><span>Småland Digital</span></div></section>

      <section className="v2-section v2-about" id="about"><img src="/figma-v2/about.png" alt="Lokalt företag i Småland" /><div><SectionHeader eyebrow="Om oss" title="Vi brinner för småföretagare i Småland" description="Vi vet att varje företag har en unik historia. Vårt jobb är att berätta den på bästa sätt online." /><a className="v2-text-link" href="/about">Läs mer om oss →</a></div></section>

      <section className="v2-section v2-faq" id="faq"><SectionHeader eyebrow="Vanliga frågor" title="Allt du behöver veta" centered /><div className="v2-faq-list">{faqs.map(([question, answer], index) => <FaqItem key={question} question={question} answer={answer} index={index} />)}</div></section>

      <section className="v2-section v2-contact" id="contact"><div><SectionHeader eyebrow="Kontakta oss" title="Låt oss prata om ditt nästa projekt" description="Har du en idé eller behöver du hjälp att komma igång? Fyll i formuläret så återkommer vi inom en arbetsdag." /><div className="v2-contact-details"><a href="mailto:contact@staarkinc.com"><Mail size={18} />contact@staarkinc.com</a><a href="tel:+46722000000"><Phone size={18} />+46 72 200 00 00</a><span><MapPin size={18} />Jönköping och Värnamo, Sverige</span></div></div><ContactForm /></section>

      <footer className="v2-footer"><div className="v2-footer-top"><div><Brand /><p>Vi bygger webbplatser som växer ditt företag.</p></div><div className="v2-footer-links"><div><strong>Snabblänkar</strong><a href="#services">Tjänster</a><a href="#portfolio">Portfolio</a><a href="#pricing">Priser</a></div><div><strong>Följ oss</strong><a href="#contact">Instagram</a><a href="#contact">Facebook</a><a href="#contact">LinkedIn</a></div></div></div><div className="v2-footer-bottom"><span>© 2026 Staark Inc. Alla rättigheter förbehållna.</span><span>Byggt med <Code2 size={15} /> React &amp; Next.js</span></div></footer>
    </main>
  );
}
