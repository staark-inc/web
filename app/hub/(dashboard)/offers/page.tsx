import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  FileText,
  Plus,
} from "lucide-react";

import type { OfferStatus } from "@/generated/prisma/client";
import { formatOfferAmount, offerStatusLabels } from "@/lib/offers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const filters = [
  "ALL",
  "DRAFT",
  "SHARED",
  "VIEWED",
  "ACCEPTED",
  "DECLINED",
] as const;

type Filter = (typeof filters)[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active: Filter = filters.includes(status as Filter)
    ? (status as Filter)
    : "ALL";

  const [offers, grouped, liveValue, acceptedValue] = await Promise.all([
    prisma.offer.findMany({
      where: active === "ALL" ? {} : { status: active as OfferStatus },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        sharedAt: true,
        viewedAt: true,
        decidedAt: true,
        oneTimePriceOre: true,
        monthlyPriceOre: true,
        client: { select: { name: true } },
        project: { select: { id: true } },
      },
    }),

    prisma.offer.groupBy({
      by: ["status"],
      _count: true,
    }),

    prisma.offer.aggregate({
      where: { status: { in: ["SHARED", "VIEWED"] } },
      _sum: { oneTimePriceOre: true },
    }),

    prisma.offer.aggregate({
      where: { status: "ACCEPTED" },
      _sum: { oneTimePriceOre: true },
    }),
  ]);

  const countFor = (value: Filter) =>
    value === "ALL"
      ? grouped.reduce((sum, item) => sum + item._count, 0)
      : grouped.find((item) => item.status === value)?._count ?? 0;

  const liveCount = countFor("SHARED") + countFor("VIEWED");

  return (
    <div className="hub-page hub-offers-v2-page">
      <header className="hub-workspace-head">
        <div>
          <span className="hub-workspace-kicker">SALES / PROPOSALS</span>
          <h1>Offers</h1>
          <p>
            Prepare proposals, follow client engagement and move accepted work into delivery.
          </p>
        </div>

        <Link href="/hub/offers/new" className="hub-workspace-primary-action">
          <Plus size={15} />
          New offer
        </Link>
      </header>

      <section className="hub-workspace-stats" aria-label="Offer overview">
        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon">
            <FileText size={16} />
          </span>
          <div>
            <small>Drafts</small>
            <strong>{countFor("DRAFT")}</strong>
            <span>Being prepared</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-info">
            <Eye size={16} />
          </span>
          <div>
            <small>Live offers</small>
            <strong>{liveCount}</strong>
            <span>{countFor("VIEWED")} viewed by client</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-value">
            <CircleDollarSign size={16} />
          </span>
          <div>
            <small>Live proposal value</small>
            <strong>{formatOfferAmount(liveValue._sum.oneTimePriceOre)}</strong>
            <span>One-time value in play</span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-good">
            <CheckCircle2 size={16} />
          </span>
          <div>
            <small>Accepted value</small>
            <strong>{formatOfferAmount(acceptedValue._sum.oneTimePriceOre)}</strong>
            <span>{countFor("ACCEPTED")} accepted offer{countFor("ACCEPTED") === 1 ? "" : "s"}</span>
          </div>
        </div>
      </section>

      <nav className="hub-workspace-filters" aria-label="Offer filters">
        {filters.map((value) => (
          <Link
            key={value}
            href={value === "ALL" ? "/hub/offers" : `/hub/offers?status=${value}`}
            className={active === value ? "hub-workspace-filter-active" : undefined}
            aria-current={active === value ? "page" : undefined}
          >
            <span>{value === "ALL" ? "All" : offerStatusLabels[value]}</span>
            <strong>{countFor(value)}</strong>
          </Link>
        ))}
      </nav>

      {offers.length === 0 ? (
        <div className="hub-empty-state">
          <FileText size={28} />
          <h2>{active === "ALL" ? "No offers yet" : "No offers with this status"}</h2>
          <p>
            {active === "ALL"
              ? "Create a draft and connect it to a client."
              : "Choose another status to see more offers."}
          </p>
          {active === "ALL" && (
            <Link href="/hub/offers/new" className="hub-secondary-button">
              Create offer
            </Link>
          )}
        </div>
      ) : (
        <section className="hub-offers-v2-list" aria-label="Offers">
          {offers.map((offer) => {
            const activityLabel = offer.decidedAt
              ? `Decided ${formatDate(offer.decidedAt)}`
              : offer.viewedAt
                ? `Viewed ${formatDate(offer.viewedAt)}`
                : offer.sharedAt
                  ? `Shared ${formatDate(offer.sharedAt)}`
                  : `Created ${formatDate(offer.createdAt)}`;

            return (
              <article key={offer.id} className="hub-offers-v2-row">
                <div className="hub-offers-v2-main">
                  <span className="hub-offers-v2-icon">
                    <FileText size={16} />
                  </span>

                  <div>
                    <div className="hub-offers-v2-title-line">
                      <Link href={`/hub/offers/${offer.id}`}>{offer.title}</Link>
                      <span className={`hub-offer-status hub-offer-status-${offer.status.toLowerCase()}`}>
                        {offerStatusLabels[offer.status]}
                      </span>
                    </div>
                    <span>{offer.client.name}</span>
                  </div>
                </div>

                <div className="hub-offers-v2-value">
                  <small>One-time</small>
                  <strong>{formatOfferAmount(offer.oneTimePriceOre)}</strong>
                  <span>
                    {offer.monthlyPriceOre !== null
                      ? `${formatOfferAmount(offer.monthlyPriceOre)}/mo`
                      : "No monthly fee"}
                  </span>
                </div>

                <div className="hub-offers-v2-activity">
                  <Clock3 size={13} />
                  <span>{activityLabel}</span>
                  {offer.project && <small>Project created</small>}
                </div>

                <div className="hub-offers-v2-tail">
                  <time dateTime={offer.updatedAt.toISOString()}>
                    Updated {formatDate(offer.updatedAt)}
                  </time>
                  <Link href={`/hub/offers/${offer.id}`}>
                    Open
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
