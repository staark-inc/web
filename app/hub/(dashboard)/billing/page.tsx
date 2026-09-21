import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  FileText,
  RefreshCw,
  Rocket,
} from "lucide-react";

import { formatOfferAmount } from "@/lib/offers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatProjectStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function BillingPage() {
  const acceptedOffers = await prisma.offer.findMany({
    where: { status: "ACCEPTED" },
    orderBy: [{ decidedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      oneTimePriceOre: true,
      monthlyPriceOre: true,
      includedMonths: true,
      decidedAt: true,
      updatedAt: true,
      client: {
        select: {
          id: true,
          name: true,
          billingEmail: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          liveUrl: true,
          startedAt: true,
        },
      },
    },
  });

  const acceptedOneTimeOre = acceptedOffers.reduce(
    (sum, offer) => sum + (offer.oneTimePriceOre ?? 0),
    0
  );

  const contractedMonthlyOre = acceptedOffers.reduce(
    (sum, offer) => sum + (offer.monthlyPriceOre ?? 0),
    0
  );

  const monthlyContracts = acceptedOffers.filter(
    (offer) => (offer.monthlyPriceOre ?? 0) > 0
  ).length;

  const launchedProjects = acceptedOffers.filter(
    (offer) => Boolean(offer.project?.liveUrl)
  ).length;

  return (
    <div className="hub-page hub-billing-v2-page">
      <header className="hub-workspace-head">
        <div>
          <span className="hub-workspace-kicker">FINANCE / CONTRACTS</span>
          <h1>Billing</h1>
          <p>
            Follow accepted commercial terms and identify what is ready for recurring billing.
            Payment status itself is not tracked yet.
          </p>
        </div>

        <Link href="/hub/offers" className="hub-workspace-primary-action">
          <FileText size={15} />
          View offers
        </Link>
      </header>

      <section className="hub-workspace-stats" aria-label="Billing overview">
        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-good">
            <CircleDollarSign size={16} />
          </span>
          <div>
            <small>Accepted value</small>
            <strong>{formatOfferAmount(acceptedOneTimeOre)}</strong>
            <span>{acceptedOffers.length} accepted contract{acceptedOffers.length === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-info">
            <RefreshCw size={16} />
          </span>
          <div>
            <small>Contracted monthly</small>
            <strong>{formatOfferAmount(contractedMonthlyOre)}</strong>
            <span>{monthlyContracts} monthly plan{monthlyContracts === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon">
            <CalendarClock size={16} />
          </span>
          <div>
            <small>Included periods</small>
            <strong>{acceptedOffers.length}</strong>
            <span>Billing start date still manual</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-good">
            <Rocket size={16} />
          </span>
          <div>
            <small>Launched projects</small>
            <strong>{launchedProjects}</strong>
            <span>Live URL recorded</span>
          </div>
        </div>
      </section>

      {acceptedOffers.length === 0 ? (
        <div className="hub-empty-state">
          <CreditCard size={28} />
          <h2>No accepted contracts yet</h2>
          <p>
            Accepted offers will appear here with their one-time and recurring commercial terms.
          </p>
          <Link href="/hub/offers" className="hub-secondary-button">
            View offers
          </Link>
        </div>
      ) : (
        <section className="hub-billing-v2-list" aria-label="Accepted billing contracts">
          {acceptedOffers.map((offer) => (
            <article key={offer.id} className="hub-billing-v2-row">
              <div className="hub-billing-v2-main">
                <span className="hub-billing-v2-icon">
                  <CreditCard size={16} />
                </span>

                <div>
                  <Link href={`/hub/offers/${offer.id}`}>{offer.client.name}</Link>
                  <span>{offer.title}</span>
                  {offer.client.billingEmail && <small>{offer.client.billingEmail}</small>}
                </div>
              </div>

              <div className="hub-billing-v2-amounts">
                <div>
                  <small>One-time</small>
                  <strong>{formatOfferAmount(offer.oneTimePriceOre)}</strong>
                </div>
                <div>
                  <small>Monthly</small>
                  <strong>{formatOfferAmount(offer.monthlyPriceOre)}</strong>
                </div>
              </div>

              <div className="hub-billing-v2-terms">
                <small>Contract terms</small>
                <strong>{offer.includedMonths} months included</strong>
                <span>
                  {offer.decidedAt
                    ? `Accepted ${formatDate(offer.decidedAt)}`
                    : `Updated ${formatDate(offer.updatedAt)}`}
                </span>
              </div>

              <div className="hub-billing-v2-project">
                <small>Delivery</small>
                {offer.project ? (
                  <>
                    <Link href={`/hub/projects/${offer.project.id}`}>{offer.project.name}</Link>
                    <span>
                      {offer.project.liveUrl
                        ? "Live"
                        : formatProjectStatus(offer.project.status)}
                    </span>
                  </>
                ) : (
                  <>
                    <strong>No project yet</strong>
                    <span>Accepted offer not linked to delivery</span>
                  </>
                )}
              </div>

              <div className="hub-billing-v2-tail">
                <Link href={`/hub/offers/${offer.id}`}>
                  Open
                  <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
