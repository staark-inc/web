import type { Metadata } from "next";
import {
  ArrowRight,
  Mail,
  MessageSquare,
  Check,
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

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="v2-hero">

          <div className="v2-hero-copy">

            <span className="v2-pill">
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

            <div className="v2-actions">

              <a
                href="#kontaktformular"
                className="v2-button v2-button-primary"
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

        <section className="v2-proof">

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
          className="v2-section"
        >

          <div className="v2-contact">

            <div>

              <div className="v2-section-header">

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


              <div className="v2-contact-details">

                <a href="mailto:contact@staarkinc.com">

                  <Mail size={20} />

                  <span>
                    contact@staarkinc.com
                  </span>

                </a>


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