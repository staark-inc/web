import { StandaloneLayout } from "../components/SiteChrome";
import SaaSPricing from "./SaaSPricing";

type Props = {
  searchParams: Promise<{ billing?: string | string[]; promo?: string | string[] }>;
};

export default async function SaaSPage({ searchParams }: Props) {
  const params = await searchParams;
  const promotion = typeof params.promo === "string" ? params.promo.trim().toUpperCase() : "";
  return (
    <div className="v2-page">
      <StandaloneLayout>
        <section className="v2-hero">
          <div className="v2-hero-copy">
            <span className="v2-pill">STAARK PLATFORM</span>
            <h1>En webbplats. Rätt verktyg för varje steg.</h1>
            <p>Alla planer gäller en produktionswebbplats med hosting, SSL och löpande drift från första dagen.</p>
          </div>
        </section>
        <SaaSPricing
          key={`${params.billing === "year" ? "year" : "month"}:${promotion}`}
          initialInterval={params.billing === "year" ? "year" : "month"}
          initialPromotionCode={["GROWTH15", "GROWTH25"].includes(promotion) ? promotion : ""}
        />
      </StandaloneLayout>
    </div>
  );
}
