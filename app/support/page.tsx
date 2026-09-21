import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock3, LifeBuoy, Mail, ShieldCheck } from "lucide-react";

import { StandaloneLayout } from "../components/SiteChrome";
import SupportRequestForm from "./SupportRequestForm";

export const metadata: Metadata = {
  title: "Support | Staark Inc.",
  description: "Skapa ett supportärende hos Staark Inc. för webbplats, hosting, e-post, buggar och ändringar.",
  alternates: { canonical: "/support" },
  openGraph: {
    title: "Support | Staark Inc.",
    description: "Behöver du hjälp med din webbplats eller hosting? Skapa ett supportärende direkt hos Staark Inc.",
    url: "/support",
    type: "website",
  },
};

export default function SupportPage() {
  return (
    <div className="v2-page">
      <StandaloneLayout>
        <section className="v2-hero public-support-hero">
          <div className="v2-hero-copy">
            <span className="v2-pill">KUNDSUPPORT</span>
            <h1>Något som inte fungerar? Vi hjälper dig.</h1>
            <p>Skapa ett supportärende för din webbplats, hosting, e-post eller en ändring du behöver. Ärendet hamnar direkt hos Staark Inc.</p>
            <div className="v2-actions">
              <a href="#supportformular" className="v2-button v2-button-primary">Skapa supportärende<LifeBuoy size={18} /></a>
              <Link href="/kontakt" className="v2-button v2-button-secondary">Kontakta oss</Link>
            </div>
          </div>
        </section>

        <section className="v2-proof public-support-proof">
          <div><Check size={20} /><span>Ärendenummer direkt</span></div>
          <div><Clock3 size={20} /><span>Tydlig prioritet</span></div>
          <div><ShieldCheck size={20} /><span>Kopplas till ditt kundkonto</span></div>
        </section>

        <section id="supportformular" className="v2-section public-support-section">
          <div className="public-support-layout">
            <div className="public-support-copy">
              <div className="v2-section-header">
                <span>BESKRIV PROBLEMET</span>
                <h2>Ju mer information, desto snabbare kan vi hjälpa.</h2>
                <p>Ange gärna vilken webbplats det gäller, vad som händer och om problemet påverkar besökare eller verksamheten just nu.</p>
              </div>

              <div className="public-support-help">
                <Mail size={18} />
                <div><strong>Vill du hellre mejla?</strong><a href="mailto:contact@staarkinc.com">contact@staarkinc.com</a></div>
              </div>
            </div>

            <SupportRequestForm />
          </div>
        </section>
      </StandaloneLayout>
    </div>
  );
}
