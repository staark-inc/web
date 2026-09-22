import type { Metadata } from "next";
import Link from "next/link";
import { StandaloneLayout } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "Allmänna villkor",
  description: "Allmänna villkor för webbutveckling, hosting och support från Staark Inc.",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <StandaloneLayout>
      <main className="legal-page">
        <div className="legal-shell">
          <header className="legal-hero">
            <span>JURIDIK</span>
            <h1>Allmänna villkor</h1>
            <p>Senast uppdaterad: 22 september 2026</p>
          </header>

          <section><h2>1. Tillämpning</h2><p>Dessa villkor gäller för tjänster som erbjuds under arbetsnamnet Staark Inc. om inget annat har avtalats skriftligen. Innan ett avtal ingås ska leverantörens fullständiga uppgifter framgå av offerten eller annan skriftlig överenskommelse. En specifik offert, orderbekräftelse eller separat överenskommelse har företräde framför dessa allmänna villkor om uppgifterna skiljer sig åt.</p><p>Villkoren är i första hand utformade för företagskunder. Om kunden är konsument gäller alltid tvingande konsumentskyddsregler framför villkor som skulle ge sämre rättigheter.</p></section>
          <section><h2>2. Avtal</h2><p>Ett avtal uppstår när kunden accepterar en offert eller när parterna på annat tydligt sätt skriftligen kommer överens om uppdragets omfattning, pris och huvudsakliga villkor.</p></section>
          <section><h2>3. Omfattning, pris och betalning</h2><p>Uppdragets omfattning, pris, eventuell löpande avgift, vad som ingår samt betalningsvillkor framgår av offerten eller annan skriftlig överenskommelse. Anges pris exklusive moms tillkommer moms enligt gällande regler.</p></section>
          <section><h2>4. Ändringar och tillägg</h2><p>Ändringar utanför avtalad omfattning kan påverka pris och leveranstid. Sådant tilläggsarbete ska så långt som möjligt godkännas av kunden innan det påbörjas.</p></section>
          <section><h2>5. Kundens ansvar</h2><p>Kunden ansvarar för att lämna korrekta uppgifter och nödvändigt material i rimlig tid. Kunden ansvarar också för att material som lämnas till Staark Inc., exempelvis bilder, texter, logotyper och varumärken, får användas för det avtalade projektet.</p></section>
          <section><h2>6. Leverans och fel</h2><p>Planerad leveranstid anges i offerten eller bestäms under projektet. Tidsplanen kan behöva justeras om kunden försenar material, beslut eller återkoppling.</p><p>Om kunden upptäcker ett fel i den avtalade leveransen ska Staark Inc. meddelas så snart som möjligt och ges rimlig möjlighet att undersöka och åtgärda felet.</p></section>
          <section><h2>7. Hosting och support</h2><p>Om hosting, underhåll eller support ingår framgår omfattning och eventuell kostnad av offerten. Tredjepartstjänster kan omfattas av respektive leverantörs tekniska begränsningar och villkor.</p></section>
          <section><h2>8. Immateriella rättigheter</h2><p>När avtalad betalning är fullgjord får kunden använda den kundspecifika slutleveransen för sitt avtalade ändamål. Tredjepartsprogram, open-source-komponenter, typsnitt, bilder eller andra licensierade delar fortsätter att omfattas av sina respektive licenser.</p><p>Generella komponenter, arbetsmetoder, mallar och tekniska lösningar som inte är unikt framtagna för kunden kan återanvändas av Staark Inc.</p></section>
          <section><h2>9. Referenser och marknadsföring</h2><p>Kundens namn, logotyp, material eller projekt används som offentlig referens eller case study först efter kundens godkännande.</p></section>
          <section><h2>10. Sekretess</h2><p>Parterna ska hantera icke-offentlig information som tydligt är konfidentiell på ett ansvarsfullt sätt och inte sprida den utanför vad som behövs för uppdraget, om inte lag kräver annat.</p></section>
          <section><h2>11. Personuppgifter</h2><p>Information om hur Staark Inc. behandlar personuppgifter finns i vår <Link href="/integritetspolicy">integritetspolicy</Link>.</p></section>
          <section><h2>12. Konsumenter och distansavtal</h2><p>Om kunden är konsument kan regler om bland annat ångerrätt, reklamation och information före avtal följa av tvingande konsumentlagstiftning. Sådana rättigheter begränsas inte av dessa villkor.</p></section>
          <section><h2>13. Lagval och tvist</h2><p>Svensk lag tillämpas. Tvister mellan företag avgörs i första hand genom dialog och annars av svensk allmän domstol. En konsument kan även ha rätt att få en tvist prövad av Allmänna reklamationsnämnden (ARN).</p></section>
          <section><h2>14. Kontakt</h2><p>Frågor om villkoren skickas till <a href="mailto:contact@staarkinc.com">contact@staarkinc.com</a>.</p></section>
        </div>
      </main>
    </StandaloneLayout>
  );
}
