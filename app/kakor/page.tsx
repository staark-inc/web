import type { Metadata } from "next";
import Link from "next/link";
import CookieSettingsButton from "../components/CookieSettingsButton";
import { StandaloneLayout } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "Kakor & cookie-inställningar",
  description: "Information om kakor, lokal lagring och Google Analytics på Staark Inc.",
  robots: { index: false, follow: true },
};

export default function CookiePolicyPage() {
  return (
    <StandaloneLayout>
      <main className="legal-page">
        <div className="legal-shell">
          <header className="legal-hero">
            <span>JURIDIK & INTEGRITET</span>
            <h1>Kakor & cookie-inställningar</h1>
            <p>Senast uppdaterad: 22 september 2026</p>
          </header>

          <section id="installningar" className="legal-cookie-control">
            <div><h2>Ändra ditt val</h2><p>Du kan när som helst återkalla eller ändra ditt samtycke.</p></div>
            <CookieSettingsButton />
          </section>

          <section>
            <h2>1. Vad är kakor?</h2>
            <p>Kakor är små uppgifter som sparas i eller läses från din webbläsare. Liknande teknik, exempelvis localStorage, kan användas för att komma ihåg ett val på din enhet.</p>
          </section>

          <section>
            <h2>2. Nödvändig lagring</h2>
            <p>Vi använder localStorage-posten <code>staark_cookie_consent_v1</code> för att komma ihåg om du har accepterat eller avvisat statistik. Denna lagring behövs för att vi ska kunna respektera ditt val och förhindra att du får samma fråga vid varje sidvisning.</p>
          </section>

          <section>
            <h2>3. Google Analytics</h2>
            <p>Google Analytics laddas på den publika webbplatsen endast om du aktivt godkänner statistik. Staark Hub och privata offertlänkar med delningstoken spåras inte med Google Analytics.</p>
            <div className="legal-table-wrap">
              <table className="legal-table">
                <thead><tr><th>Namn</th><th>Leverantör</th><th>Syfte</th><th>Standardlivslängd</th></tr></thead>
                <tbody>
                  <tr><td><code>_ga</code></td><td>Google Analytics</td><td>Skiljer mellan användare.</td><td>Upp till 2 år.</td></tr>
                  <tr><td><code>_ga_*</code></td><td>Google Analytics</td><td>Bevarar sessionsstatus.</td><td>Upp till 2 år.</td></tr>
                </tbody>
              </table>
            </div>
            <p>Faktisk livslängd kan begränsas av webbläsaren eller av inställningar i Google Analytics.</p>
          </section>

          <section>
            <h2>4. Samtycke</h2>
            <p>Statistik är avstängd tills du gör ett aktivt val. Alternativen att acceptera och avvisa visas samtidigt. Du kan också välja statistik separat via Anpassa.</p>
          </section>

          <section>
            <h2>5. Återkalla samtycke</h2>
            <p>Använd knappen ovan eller Cookie-inställningar i sidfoten. När statistik avvisas uppdaterar vi samtyckesstatusen och försöker ta bort befintliga Google Analytics-kakor från vår domän.</p>
          </section>

          <section>
            <h2>6. Personuppgifter</h2>
            <p>Mer information om hur vi behandlar personuppgifter finns i vår <Link href="/integritetspolicy">integritetspolicy</Link>.</p>
          </section>
        </div>
      </main>
    </StandaloneLayout>
  );
}
