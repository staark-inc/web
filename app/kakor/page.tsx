import type { Metadata } from "next";
import Link from "next/link";
import CookieSettingsButton from "../components/CookieSettingsButton";
import { StandaloneLayout } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "Kakor & cookie-inställningar",
  description: "Information om kakor, lokal lagring, Google Analytics och Google Ads på Staark Inc.",
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
            <p>Senast uppdaterad: 10 oktober 2026</p>
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
            <p>Vi använder localStorage-posten <code>staark_cookie_consent_v2</code> för att komma ihåg om du har accepterat eller avvisat statistik och annonsmätning. Denna lagring behövs för att vi ska kunna respektera ditt val och förhindra att du får samma fråga vid varje sidvisning.</p>
          </section>

          <section>
            <h2>3. Google Analytics</h2>
            <p>Google Analytics laddas på den publika webbplatsen endast om du aktivt godkänner statistik. Staark Hub, privata offertlänkar och sidor för betalning och installation spåras inte med Google Analytics.</p>
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
            <h2>4. Google Ads</h2>
            <p>Om du godkänner Marknadsföring använder vi Google Ads för att mäta om annonser leder till en skickad kontaktförfrågan. Taggen aktiveras endast efter ditt samtycke och används inte på privata sidor. Anpassade annonser är avstängda.</p>
            <p>Google Ads kan använda kakor med namn som börjar med <code>_gcl_</code> för att koppla ett annonsklick till en kontaktförfrågan. Händelsen innehåller ett slumpmässigt konverterings-ID, inte formulärets namn, e-postadress eller meddelande.</p>
          </section>

          <section>
            <h2>5. Samtycke</h2>
            <p>Statistik och annonsmätning är avstängda tills du gör ett aktivt val. Alternativen att acceptera och avvisa visas samtidigt. Du kan också välja statistik och annonsmätning var för sig via Anpassa. Tidigare samtycke till enbart statistik räknas inte som samtycke till annonsmätning.</p>
          </section>

          <section>
            <h2>6. Återkalla samtycke</h2>
            <p>Använd knappen ovan eller Cookie-inställningar i sidfoten. När du återkallar ett val uppdaterar vi samtyckesstatusen och försöker ta bort motsvarande Google Analytics- eller Google Ads-kakor från vår domän. Sidan kan laddas om för att stoppa en redan inläst tagg.</p>
          </section>

          <section>
            <h2>7. Personuppgifter</h2>
            <p>Mer information om hur vi behandlar personuppgifter finns i vår <Link href="/integritetspolicy">integritetspolicy</Link>.</p>
          </section>
        </div>
      </main>
    </StandaloneLayout>
  );
}
