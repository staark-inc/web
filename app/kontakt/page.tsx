import type { Metadata } from "next";
import {
  ArrowRight,
  MessageSquare,
  Check,
} from "lucide-react";

import { StandaloneLayout } from "../components/SiteChrome";
import ContactForm from "../components/ContactForm";
import ContactEmailLink from "../components/ContactEmailLink";

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
    <div className="site-page">
      <StandaloneLayout>

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="site-hero">

          <div className="site-hero-copy">

            <span className="site-pill">
              KONTAKT
            </span>

            <h1>
              Berätta vad du vill bygga.
            </h1>

            <p>
              Ny webbplats, SEO, webbutveckling eller en
              skräddarsydd digital lösning? Berätta kort
              vad du behöver så tar vi nästa steg tillsammans.
            </p>

            <div className="site-actions">

              <a
                href="#kontaktformular"
                className="site-button site-button-primary"
              >
                Få kostnadsfri offert

                <ArrowRight size={18} />
              </a>

            </div>

          </div>

        </section>


        {/* =====================================================
            QUICK TRUST
        ===================================================== */}

        <section className="site-proof">

          <div>
            <Check size={20} />

            <span>
              Kostnadsfri offert
            </span>
          </div>

          <div>
            <Check size={20} />

            <span>
              Personlig kontakt
            </span>
          </div>

          <div>
            <Check size={20} />

            <span>
              Ingen förbindelse
            </span>
          </div>

        </section>


        {/* =====================================================
            CONTACT
        ===================================================== */}

        <section
          id="kontaktformular"
          className="site-section"
        >

          <div className="site-contact">

            <div>

              <div className="site-section-header">

                <span>
                  LÅT OSS PRATA
                </span>

                <h2>
                  Vad kan vi hjälpa dig med?
                </h2>

                <p>
                  Du behöver inte ha allt planerat redan.
                  Beskriv kort vad du vill göra så hjälper
                  vi dig att hitta rätt lösning.
                </p>

              </div>


              <div className="site-contact-details">

                <ContactEmailLink iconSize={20} />


                <div>

                  <MessageSquare size={20} />

                  <span>
                    Personlig kontakt genom hela projektet
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
