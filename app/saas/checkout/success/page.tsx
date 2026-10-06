import Link from "next/link";

import ContinueSetupButton from "./ContinueSetupButton";

export default async function SaaSCheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    session_id?: string;
  }>;
}) {
  const {
    session_id: sessionId,
  } = await searchParams;

  return (
    <main className="site-page">
      <section className="site-section">
        <div className="site-section-header centered">
          <span>STAARK SAAS</span>

          <h1>
            Din prenumeration är aktiv.
          </h1>

          <p>
            Tack. Betalningen är registrerad.
            Nästa steg är att konfigurera
            din webbplats.
          </p>

          {sessionId ? (
            <>
              <ContinueSetupButton
                sessionId={sessionId}
              />

              <small>
                Checkout reference:{" "}
                {sessionId}
              </small>
            </>
          ) : (
            <p>
              Checkout-referensen saknas.
              Kontakta Staark support om du
              behöver hjälp.
            </p>
          )}

          <div className="site-actions">
            <Link
              href="/"
              className="site-button"
            >
              Till Staark Inc.
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
