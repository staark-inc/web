import { WorkspaceTabs } from "@/components/hub/WorkspaceTabs";
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
    <div className="hub-page hub-offers-v2-page hub-crm-workspace sw-offers-board-page">
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

      <WorkspaceTabs label="Offer filters" activeKey={active}
        tabs={filters.map((value) => ({
          key: value,
          label: value === "ALL" ? "All" : offerStatusLabels[value],
          href: value === "ALL" ? "/hub/offers" : `/hub/offers?status=${value}`,
          count: countFor(value),
        }))}/>
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
        <section className="sw-offer-board-grid" aria-label="Offers">
          {offers.map((offer) => {
            const activityLabel = offer.decidedAt
              ? `Decided ${formatDate(offer.decidedAt)}`
              : offer.viewedAt
                ? `Viewed ${formatDate(offer.viewedAt)}`
                : offer.sharedAt
                  ? `Shared ${formatDate(offer.sharedAt)}`
                  : `Created ${formatDate(offer.createdAt)}`;

            return (
              <article key={offer.id} className="sw-offer-board-card">
                <header className="sw-offer-board-header">
                  <span className="sw-offer-board-icon"><FileText size={18}/></span>
                  <div className="sw-offer-board-title">
                    <Link href={`/hub/offers/${offer.id}`}>{offer.title}</Link>
                    <small>{offer.client.name}</small>
                  </div>
                  <span className={`hub-offer-status hub-offer-status-${offer.status.toLowerCase()}`}>
                    {offerStatusLabels[offer.status]}
                  </span>
                </header>
                <div className="sw-offer-board-body">
                  <div className="sw-offer-board-price">
                    <span>One-time proposal</span>
                    <strong>{formatOfferAmount(offer.oneTimePriceOre)}</strong>
                  </div>
                  <div className="sw-offer-board-monthly">
                    <span>Monthly</span>
                    <strong>{offer.monthlyPriceOre !== null
                      ? `${formatOfferAmount(offer.monthlyPriceOre)}/mo`
                      : "No monthly fee"}</strong>
                  </div>
                  <div className="sw-offer-board-activity">
                    <Clock3 size={14}/><span>{activityLabel}</span>
                  </div>
                  {offer.project && <span className="sw-offer-board-project"><CheckCircle2 size={14}/> Project created</span>}
                </div>
                <footer className="sw-offer-board-footer">
                  <time dateTime={offer.updatedAt.toISOString()}>Updated {formatDate(offer.updatedAt)}</time>
                  <Link href={`/hub/offers/${offer.id}`}>Open offer <ArrowRight size={15}/></Link>
                </footer>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
