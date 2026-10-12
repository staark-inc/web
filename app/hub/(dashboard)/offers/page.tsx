import { WorkspaceTabs } from "@/components/hub/WorkspaceTabs";
import { StatusBadge, WorkspacePage, PageHeader, Metrics, Metric, ActionLink, BoardCard, CardHeader, CardIcon, CardBody, CardFooter } from "@/components/hub/workspace";
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
    <WorkspacePage className="hub-offers-v2-page hub-crm-workspace sw-offers-board-page">
            <PageHeader
        eyebrow="SALES / PROPOSALS"
        title="Offers"
        description="Prepare proposals, follow client engagement and move accepted work into delivery."
        action={<ActionLink href="/hub/offers/new"><Plus size={16} /> New offer</ActionLink>}
      />

            <Metrics label="Offer overview">
        <Metric label="Drafts" value={countFor("DRAFT")} description={"Being prepared"} icon={<FileText size={18} />} />
        <Metric label="Live offers" value={liveCount} description={`${countFor("VIEWED")} viewed by client`} icon={<Eye size={18} />} />
        <Metric label="Live proposal value" value={formatOfferAmount(liveValue._sum.oneTimePriceOre)} description={"One-time value in play"} icon={<CircleDollarSign size={18} />} />
        <Metric label="Accepted value" value={formatOfferAmount(acceptedValue._sum.oneTimePriceOre)} description={`${countFor("ACCEPTED")} accepted offer${countFor("ACCEPTED") === 1 ? "" : "s"}`} icon={<CheckCircle2 size={18} />} />
      </Metrics>

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
            <ActionLink href="/hub/offers/new" variant="secondary">
              Create offer
            </ActionLink>
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
              <BoardCard key={offer.id} className="sw-offer-board-card sw-entity-card">
                <CardHeader className="sw-offer-board-header">
                  <CardIcon className="sw-offer-board-icon"><FileText size={18}/></CardIcon>
                  <div className="sw-offer-board-title sw-entity-title">
                    <Link href={`/hub/offers/${offer.id}`}>{offer.title}</Link>
                    <small>{offer.client.name}</small>
                  </div>
                  <StatusBadge
                    tone={
                      offer.status === "ACCEPTED" ? "success"
                      : offer.status === "DECLINED" ? "danger"
                      : offer.status === "SHARED" || offer.status === "VIEWED"
                        ? "info" : "neutral"
                    }
                  >
                    {offerStatusLabels[offer.status]}
                  </StatusBadge>
                </CardHeader>
                <CardBody className="sw-offer-board-body">
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
                </CardBody>
                <CardFooter className="sw-offer-board-footer">
                  <time dateTime={offer.updatedAt.toISOString()}>Updated {formatDate(offer.updatedAt)}</time>
                  <Link href={`/hub/offers/${offer.id}`} className="sw-entity-action">Open offer <ArrowRight size={15}/></Link>
                </CardFooter>
              </BoardCard>
            );
          })}
        </section>
      )}
    </WorkspacePage>
  );
}
