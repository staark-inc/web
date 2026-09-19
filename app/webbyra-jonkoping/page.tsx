import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webbyrå Jönköping | Webbdesign & SEO | Staark Inc.",
  description:
    "Webbyrå i Jönköping för företag som vill växa online. Vi hjälper dig med webbdesign, SEO och moderna hemsidor. Få en kostnadsfri offert.",
};

export default function JonkopingPage() {
  return (
    <main>
      {/* HERO */}
      <section>
        <p>WEBBYRÅ I JÖNKÖPING</p>

        <h1>
          Moderna hemsidor för
          <br />
          företag i Jönköping
        </h1>

        <p>
          Staark hjälper företag i Jönköping att bygga snabba,
          moderna och SEO-optimerade hemsidor som är skapade
          för att generera fler kunder.
        </p>

        <div>
          <Link href="/kontakt">
            Få kostnadsfri offert
          </Link>

          <Link href="/projekt">
            Se våra projekt
          </Link>
        </div>
      </section>

      {/* SERVICES */}
      <section>
        <p>VÅRA TJÄNSTER</p>

        <h2>Allt ditt företag behöver online</h2>

        <div>
          <article>
            <h3>Webbdesign</h3>
            <p>
              Moderna och mobilanpassade hemsidor anpassade
              efter ditt företag och dina kunder.
            </p>

            <Link href="/tjanster/webbdesign">
              Läs mer
            </Link>
          </article>

          <article>
            <h3>SEO</h3>
            <p>
              Vi hjälper din hemsida att synas bättre på Google
              när potentiella kunder söker efter dina tjänster.
            </p>

            <Link href="/tjanster/seo">
              Läs mer
            </Link>
          </article>

          <article>
            <h3>Webbhotell & underhåll</h3>
            <p>
              Vi kan ta hand om drift, säkerhet och uppdateringar
              så att du kan fokusera på ditt företag.
            </p>
          </article>
        </div>
      </section>

      {/* LOCAL */}
      <section>
        <h2>En lokal webbyrå för företag i Jönköping</h2>

        <p>
          Driver du företag i Jönköping och behöver en ny hemsida
          eller vill förbättra den du redan har?
        </p>

        <p>
          Vi hjälper små och medelstora företag att skapa en
          professionell digital närvaro med fokus på enkelhet,
          prestanda och synlighet på Google.
        </p>
      </section>

      {/* PROCESS */}
      <section>
        <p>SÅ FUNGERAR DET</p>

        <h2>Från idé till färdig hemsida</h2>

        <ol>
          <li>
            <strong>01. Vi pratar</strong>
            <p>
              Vi går igenom ditt företag, dina mål och vad du
              behöver från din nya hemsida.
            </p>
          </li>

          <li>
            <strong>02. Vi designar & bygger</strong>
            <p>
              Vi skapar hemsidan och anpassar den för både
              mobil, dator och Google.
            </p>
          </li>

          <li>
            <strong>03. Vi lanserar</strong>
            <p>
              När allt är klart publicerar vi hemsidan och
              hjälper dig vidare efter lanseringen.
            </p>
          </li>
        </ol>
      </section>

      {/* PRICING CTA */}
      <section>
        <h2>Vad kostar en hemsida?</h2>

        <p>
          Våra hemsidor börjar från 2 999 kr.
          Du får alltid veta priset innan vi börjar.
        </p>

        <Link href="/priser">
          Se våra priser
        </Link>
      </section>

      {/* FINAL CTA */}
      <section>
        <p>REDO ATT KOMMA IGÅNG?</p>

        <h2>
          Låt oss bygga något
          <br />
          bra tillsammans.
        </h2>

        <p>
          Berätta kort om ditt företag så återkommer vi
          med ett förslag.
        </p>

        <Link href="/kontakt">
          Få kostnadsfri offert
        </Link>
      </section>
    </main>
  );
}