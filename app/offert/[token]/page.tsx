import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import { formatOfferAmount } from "@/lib/offers";
import { prisma } from "@/lib/prisma";

import { respondToOffer } from "./actions";
import OfferViewTracker from "./OfferViewTracker";

export const dynamic = "force-dynamic";

export default async function PublicOfferPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const { token } = await params;
  const { result } = await searchParams;

  const offer = await prisma.offer.findUnique({
    where: {
      shareToken: token,
    },
    include: {
      client: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!offer || offer.status === "DRAFT") {
    notFound();
  }

  const decided =
    offer.status === "ACCEPTED" ||
    offer.status === "DECLINED";

  return (
    <main className="public-offer-page">
      {!decided && (
        <OfferViewTracker token={token} />
      )}

      <section className="public-offer-shell">
        <header className="public-offer-header">
          <div className="public-offer-brand">
            STAARK INC.
          </div>

          <span
            className={`public-offer-state public-offer-state-${offer.status.toLowerCase()}`}
          >
            {offer.status === "ACCEPTED" ? (
              <CheckCircle2 size={15} />
            ) : offer.status === "DECLINED" ? (
              <XCircle size={15} />
            ) : (
              <Clock3 size={15} />
            )}

            {offer.status === "ACCEPTED"
              ? "Accepterad"
              : offer.status === "DECLINED"
                ? "Avböjd"
                : "Väntar på svar"}
          </span>
        </header>

        <div className="public-offer-intro">
          <span>OFFERT</span>
          <h1>{offer.title}</h1>
          <p>För {offer.client.name}</p>
        </div>

        <div className="public-offer-prices">
          <div>
            <span>Webbplats</span>
            <strong>
              {formatOfferAmount(
                offer.oneTimePriceOre
              )}
            </strong>
            <small>Engångspris, exkl. moms</small>
          </div>

          <div>
            <span>Hosting + support</span>
            <strong>
              {formatOfferAmount(
                offer.monthlyPriceOre
              )}
            </strong>
            <small>Per månad, exkl. moms</small>
          </div>

          <div>
            <span>Support ingår</span>
            <strong>
              {offer.includedMonths} mån
            </strong>
            <small>Enligt förslaget</small>
          </div>
        </div>

        <div className="public-offer-content">
          <section>
            <h2>Omfattning och leverans</h2>
            <p>
              {offer.scope ||
                "Ingen omfattning angiven."}
            </p>
          </section>

          {offer.terms && (
            <section>
              <h2>Villkor</h2>
              <p>{offer.terms}</p>
            </section>
          )}
        </div>

        {result === "accepted" && (
          <div className="public-offer-message success">
            Tack! Offerten är accepterad. Vi återkommer med nästa steg.
          </div>
        )}

        {result === "declined" && (
          <div className="public-offer-message">
            Tack för återkopplingen. Offerten är markerad som avböjd.
          </div>
        )}

        {result === "locked" && (
          <div className="public-offer-message">
            Offerten har redan fått ett svar eller har ändrats.
          </div>
        )}

        {!decided && (
          <div className="public-offer-decision">
            <div>
              <h2>Svara på offerten</h2>
              <p>
                Ditt svar registreras direkt hos Staark Inc.
              </p>
            </div>

            <div className="public-offer-buttons">
              <form
                action={respondToOffer.bind(
                  null,
                  token
                )}
              >
                <button
                  type="submit"
                  name="decision"
                  value="ACCEPTED"
                  className="public-offer-accept"
                >
                  Acceptera offert
                </button>
              </form>

              <form
                action={respondToOffer.bind(
                  null,
                  token
                )}
              >
                <button
                  type="submit"
                  name="decision"
                  value="DECLINED"
                  className="public-offer-decline"
                >
                  Avböj
                </button>
              </form>
            </div>
          </div>
        )}

        <footer className="public-offer-footer">
          Har du frågor? Svara på mejlet du fick från oss så hjälper vi dig.
        </footer>
      </section>
    </main>
  );
}
