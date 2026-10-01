import Link from "next/link";

export default async function SaaSCheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  return (
    <main className="v2-page">
      <section className="v2-section">
        <div className="v2-section-header centered">
          <span>STAARK SAAS</span>
          <h1>Din provperiod har startat.</h1>
          <p>
            Tack. Din 14-dagars provperiod är registrerad. Vi bekräftar abonnemanget
            via Stripe innan kontot provisioneras.
          </p>

          {sessionId ? (
            <small>Checkout reference: {sessionId}</small>
          ) : null}

          <div className="v2-actions">
            <Link href="/" className="v2-button v2-button-primary">
              Till Staark Inc.
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
