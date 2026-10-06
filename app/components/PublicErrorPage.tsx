import Link from "next/link";
import { SiteHeader, SiteFooter } from "./SiteChrome";

export default function PublicErrorPage({ code, onRetry }: { code: "404" | "500"; onRetry?: () => void }) {
  const missing = code === "404";
  return (
    <main className="site-page">
      <SiteHeader />
      <section className="site-error-shell" aria-labelledby="site-error-title">
        <div className="site-error-content">
          <span className="site-error-code" aria-hidden="true">{code}</span>
          <h1 id="site-error-title">{missing ? "Sidan kunde inte hittas" : "Något gick fel"}</h1>
          <p>{missing ? "Sidan kan ha flyttats eller länken kan vara felaktig. Gå till startsidan eller kontakta oss så hjälper vi dig." : "Vi kunde inte visa sidan just nu. Försök igen eller kontakta oss om problemet fortsätter."}</p>
          <div className="site-actions">
            {onRetry ? <button type="button" className="site-button site-button-primary" onClick={onRetry}>Försök igen</button> : null}
            <Link href="/" className={`site-button ${onRetry ? "site-button-light" : "site-button-primary"}`}>Till startsidan</Link>
            <Link href="/kontakt" className="site-button site-button-light">Kontakta Staark Inc.</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
