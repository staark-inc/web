import type { Metadata } from "next";
import Link from "next/link";
import { StandaloneLayout } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description: "Så behandlar Staark Inc. personuppgifter och vilka rättigheter du har.",
  robots: { index: false, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <StandaloneLayout>
      <main className="legal-page">
        <div className="legal-shell">
          <header className="legal-hero">
            <span>JURIDIK & INTEGRITET</span>
            <h1>Integritetspolicy</h1>
            <p>Senast uppdaterad: 22 september 2026</p>
          </header>

          <section>
            <h2>1. Personuppgiftsansvarig</h2>
            <p>Staark Inc. ansvarar för den behandling av personuppgifter som beskrivs i denna policy.</p>
            <p>Kontakt: <a href="mailto:contact@staarkinc.com">contact@staarkinc.com</a><br />Webbplats: <a href="https://staarkinc.com">staarkinc.com</a></p>
          </section>

          <section>
            <h2>2. Vilka uppgifter vi behandlar</h2>
            <p>Beroende på hur du använder våra tjänster kan vi behandla namn, e-postadress, företagsnamn, webbplatsadress, innehåll i kontakt- och supportmeddelanden samt uppgifter som behövs för offert-, projekt-, kund- och fakturaadministration.</p>
            <p>Om du godkänner statistik behandlas även tekniska uppgifter om hur den publika webbplatsen används via Google Analytics, exempelvis besökta sidor, ungefärlig enhetsinformation och sessionsdata.</p>
          </section>

          <section>
            <h2>3. Varför vi behandlar uppgifter</h2>
            <div className="legal-table-wrap">
              <table className="legal-table">
                <thead><tr><th>Ändamål</th><th>Rättslig grund</th></tr></thead>
                <tbody>
                  <tr><td>Svara på förfrågningar och vidta åtgärder inför ett möjligt avtal.</td><td>Avtal/åtgärder före avtal när du själv är avtalspart. När du företräder ett företag kan behandlingen i stället baseras på vårt berättigade intresse av att hantera affärskontakten.</td></tr>
                  <tr><td>Hantera offerter, projekt, support och kundrelationer.</td><td>Avtal och, för kontaktpersoner hos företagskunder, berättigat intresse.</td></tr>
                  <tr><td>Uppfylla krav som följer av exempelvis bokförings- eller annan tillämplig lagstiftning.</td><td>Rättslig förpliktelse.</td></tr>
                  <tr><td>Mäta hur den publika webbplatsen används via Google Analytics.</td><td>Samtycke.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>4. Mottagare och leverantörer</h2>
            <p>Vi kan använda leverantörer för hosting, e-post, drift, säkerhet och andra tekniska tjänster. De får bara behandla personuppgifter i den omfattning som behövs för att leverera tjänsten till oss.</p>
            <p>Google Analytics används endast när du har godkänt statistik. Vi lämnar även ut uppgifter när det krävs enligt lag eller ett bindande myndighetsbeslut.</p>
          </section>

          <section>
            <h2>5. Överföring utanför EU/EES</h2>
            <p>Vissa tekniska leverantörer kan behandla uppgifter utanför EU/EES. När en sådan överföring sker ska den omfattas av en tillämplig mekanism och lämpliga skyddsåtgärder enligt GDPR.</p>
          </section>

          <section>
            <h2>6. Hur länge uppgifter sparas</h2>
            <p>Vi sparar personuppgifter så länge de behövs för det ändamål de samlades in för, exempelvis för att hantera en förfrågan, ett pågående projekt, support eller en kundrelation. Uppgifter som måste bevaras enligt lag sparas under den tid lagen kräver.</p>
            <p>Samtycke till statistik sparas lokalt i din webbläsare så att vi kan respektera ditt val. Du kan när som helst ändra valet via Cookie-inställningar i sidfoten.</p>
          </section>

          <section>
            <h2>7. Dina rättigheter</h2>
            <p>Beroende på situationen kan du ha rätt att få tillgång till dina uppgifter, begära rättelse eller radering, begära begränsning, invända mot viss behandling och få ut uppgifter i ett portabelt format. Om behandling bygger på samtycke kan du återkalla samtycket när som helst.</p>
            <p>Kontakta oss på <a href="mailto:contact@staarkinc.com">contact@staarkinc.com</a>. Du har också rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY).</p>
          </section>

          <section>
            <h2>8. Automatiserade beslut</h2>
            <p>Vi använder inte automatiserat beslutsfattande som medför rättsliga följder eller på liknande sätt påverkar dig väsentligt.</p>
          </section>

          <section>
            <h2>9. Kakor och statistik</h2>
            <p>Information om de kakor och den lokala lagring som används finns på sidan <Link href="/kakor">Kakor & cookie-inställningar</Link>.</p>
          </section>

          <section>
            <h2>10. Ändringar</h2>
            <p>Policyn kan uppdateras när våra tjänster eller behandlingar förändras. Den senaste versionen publiceras alltid på denna sida.</p>
          </section>
        </div>
      </main>
    </StandaloneLayout>
  );
}
