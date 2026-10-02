import "./setup.css";
import Link from "next/link";

import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SaaSSetupPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
  }>;
}) {
  const {
    token,
  } = await searchParams;

  if (!token) {
    return (
      <main className="v2-page">
        <section className="v2-section">
          <div className="v2-section-header centered">
            <span>STAARK SAAS</span>

            <h1>
              Installationslänken saknas.
            </h1>

            <p>
              Starta installationen från
              din checkout-sida.
            </p>

            <Link
              href="/saas"
              className="v2-button"
            >
              Till SaaS
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="v2-page">
      <section className="v2-section">
        <div className="v2-section-header centered">
          <span>
            STAARK SAAS
          </span>

          <h1>
            Konfigurera din webbplats
          </h1>

          <p>
            Några uppgifter till,
            sedan skapar vi webbplatsen.
          </p>
        </div>

        <SetupForm
          token={token}
        />
      </section>
    </main>
  );
}
