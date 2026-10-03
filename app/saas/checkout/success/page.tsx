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
    <main className="v2-page">
      <section className="v2-section">
        <div className="v2-section-header centered">
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

          <div className="v2-actions">
            <Link
              href="/"
              className="v2-button"
            >
              Till Staark Inc.
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
