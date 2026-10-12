import Link from "next/link";
import { WorkspacePage, PageHeader, Metrics, Metric, ActionLink, BoardCard } from "@/components/hub/workspace";
import {
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
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
    <WorkspacePage className="hub-billing-v2-page hub-crm-workspace">
            <PageHeader
        eyebrow="FINANCE / CONTRACTS"
        title="Billing"
        description="Follow accepted agency contracts here. Stripe-backed SaaS subscriptions are managed in their own workspace."
        action={<ActionLink href="/hub/saas/subscriptions"><CreditCard size={16} /> SaaS subscriptions</ActionLink>}
      />

            <Metrics label="Billing overview">
        <Metric label="Accepted value" value={formatOfferAmount(acceptedOneTimeOre)} description={`${acceptedOffers.length} accepted contract${acceptedOffers.length === 1 ? "" : "s"}`} icon={<CircleDollarSign size={18} />} />
        <Metric label="Contracted monthly" value={formatOfferAmount(contractedMonthlyOre)} description={`${monthlyContracts} monthly plan${monthlyContracts === 1 ? "" : "s"}`} icon={<RefreshCw size={18} />} />
        <Metric label="Included periods" value={acceptedOffers.length} description={"Billing start date still manual"} icon={<CalendarClock size={18} />} />
        <Metric label="Launched projects" value={launchedProjects} description={"Live URL recorded"} icon={<Rocket size={18} />} />
      </Metrics>

      {acceptedOffers.length === 0 ? (
        <div className="hub-empty-state">
          <CreditCard size={28} />
          <h2>No accepted contracts yet</h2>
          <p>
            Accepted offers will appear here with their one-time and recurring commercial terms.
          </p>
          <ActionLink href="/hub/offers" variant="secondary">
            View offers
          </ActionLink>
        </div>
      ) : (
        <section className="hub-billing-v2-list" aria-label="Accepted billing contracts">
          {acceptedOffers.map((offer) => (
            <BoardCard key={offer.id} className="hub-billing-v2-row">
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
            </BoardCard>
          ))}
        </section>
      )}
    </WorkspacePage>
  );
}
