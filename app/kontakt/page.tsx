import type { Metadata } from "next";
import {
  Mail,
  MessageSquare,
  Clock,
  ArrowRight,
} from "lucide-react";

import { StandaloneLayout } from "../components/SiteChrome";
import ContactForm from "../components/ContactForm";

export const metadata: Metadata = {
  title: "Kontakt | Webbyrå Jönköping & Värnamo",
  description:
    "Kontakta Staark Inc. för webbdesign, SEO och webbutveckling. Berätta om ditt projekt och få en kostnadsfri offert.",

  alternates: {
    canonical: "/kontakt",
  },

  openGraph: {
    title: "Kontakta Staark Inc.",
    description:
      "Har du ett projekt i åtanke? Kontakta oss för en kostnadsfri offert.",
    url: "/kontakt",
    type: "website",
  },
};

export default function KontaktPage() {
  return (
    <div className="v2-page">
      <StandaloneLayout>

        {/* HERO */}
        <section className="v2-hero">
          <div className="v2-hero-copy">
            <span className="v2-pill">KONTAKT</span>

            <h1>
              Har du ett projekt
              <br />
              i åtanke?
            </h1>

            <p>
              Berätta vad du behöver så återkommer vi med ett
              förslag anpassat efter ditt företag.
            </p>

            <div className="v2-actions">
              <a
                href="#kontaktformular"
                className="v2-button v2-button-primary"
              >
                Berätta om ditt projekt
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section
          id="kontaktformular"
          className="v2-section"
        >
          <div className="v2-contact">

            <div>
              <div className="v2-section-header">
                <span>LÅT OSS PRATA</span>

                <h2>
                  Vad kan vi hjälpa dig med?
                </h2>

                <p>
                  Ny hemsida, SEO, webbutveckling eller hjälp
                  med en befintlig webbplats? Skicka ett
                  meddelande så tar vi det därifrån.
                </p>
              </div>

              <div className="v2-contact-details">

                <div>
                  <Mail size={20} />
                  <span>
                    Svar direkt till din e-post
                  </span>
                </div>

                <div>
                  <MessageSquare size={20} />
                  <span>
                    Personlig kontakt
                  </span>
                </div>

                <div>
                  <Clock size={20} />
                  <span>
                    Vi återkommer så snart vi kan
                  </span>
                </div>

              </div>
            </div>

            <ContactForm />

          </div>
        </section>

      </StandaloneLayout>
    </div>
  );
}