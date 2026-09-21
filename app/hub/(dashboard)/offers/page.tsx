import Link from "next/link";
import { CheckCircle2, Clock3, FileText, Plus } from "lucide-react";

import type { OfferStatus } from "@/generated/prisma/client";
import { formatOfferAmount, offerStatusLabels } from "@/lib/offers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const filters = ["ALL", "DRAFT", "SHARED", "ACCEPTED", "DECLINED"] as const;
type Filter = (typeof filters)[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default async function OffersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const active: Filter = filters.includes(status as Filter) ? status as Filter : "ALL";

  const [offers, grouped] = await Promise.all([
    prisma.offer.findMany({
      where: active === "ALL" ? {} : { status: active as OfferStatus },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, title: true, status: true, createdAt: true,
        oneTimePriceOre: true, monthlyPriceOre: true,
        client: { select: { name: true } },
      },
    }),
    prisma.offer.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (value: Filter) => value === "ALL"
    ? grouped.reduce((sum, item) => sum + item._count, 0)
    : grouped.find((item) => item.status === value)?._count ?? 0;

  return (
    <div className="hub-page">
      <div className="hub-page-header">
        <div><h1>Offers</h1><p>Prepare proposals and follow them from draft to client decision.</p></div>
        <Link href="/hub/offers/new" className="hub-send-button"><Plus size={16} />New offer</Link>
      </div>

      <section className="hub-client-stats">
        <div className="hub-client-stat"><span className="hub-client-stat-label"><FileText size={16} />Drafts</span><strong>{countFor("DRAFT")}</strong><small>Being prepared</small></div>
        <div className="hub-client-stat"><span className="hub-client-stat-label"><Clock3 size={16} />Shared</span><strong>{countFor("SHARED")}</strong><small>Awaiting a decision</small></div>
        <div className="hub-client-stat"><span className="hub-client-stat-label"><CheckCircle2 size={16} />Accepted</span><strong>{countFor("ACCEPTED")}</strong><small>Ready for project work</small></div>
      </section>

      <nav className="hub-lead-filters" aria-label="Offer filters">
        {filters.map((value) => <Link
          key={value}
          href={value === "ALL" ? "/hub/offers" : `/hub/offers?status=${value}`}
          className={`hub-lead-filter ${active === value ? "hub-lead-filter-active" : ""}`}
          aria-current={active === value ? "page" : undefined}
        ><span>{value === "ALL" ? "All" : offerStatusLabels[value]}</span><strong>{countFor(value)}</strong></Link>)}
      </nav>

      <section className="hub-list-section">
        <div className="hub-list-section-header"><div><h2>All offers</h2><p>Scope, prices and decisions together with each client.</p></div><span className="hub-list-count">{countFor("ALL")} offers</span></div>
        {offers.length === 0 ? (
          <div className="hub-empty-state"><FileText size={28} /><h2>{active === "ALL" ? "No offers yet" : "No offers with this status"}</h2><p>{active === "ALL" ? "Create a draft and connect it to a client." : "Choose another status to see more offers."}</p>{active === "ALL" && <Link href="/hub/offers/new" className="hub-secondary-button">Create offer</Link>}</div>
        ) : (
          <div className="hub-client-list hub-offer-list">
            {offers.map((offer) => <Link href={`/hub/offers/${offer.id}`} key={offer.id} className="hub-client-row">
              <div className="hub-client-avatar"><FileText size={17} /></div>
              <div className="hub-client-main"><strong>{offer.title}</strong><span className="hub-client-email">{offer.client.name}</span></div>
              <div className="hub-client-meta"><span className={`hub-offer-status hub-offer-status-${offer.status.toLowerCase()}`}>{offerStatusLabels[offer.status]}</span><span>{formatOfferAmount(offer.oneTimePriceOre)}</span>{offer.monthlyPriceOre !== null && <span>{formatOfferAmount(offer.monthlyPriceOre)}/mo</span>}<time dateTime={offer.createdAt.toISOString()}>{formatDate(offer.createdAt)}</time></div>
            </Link>)}
          </div>
        )}
      </section>
    </div>
  );
}
