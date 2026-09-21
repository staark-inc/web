import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, ExternalLink, FolderKanban, Mail } from "lucide-react";

import { formatOfferAmount, offerStatusLabels } from "@/lib/offers";
import { prisma } from "@/lib/prisma";
import OfferForm from "../OfferForm";
import OfferStatusActions from "../OfferStatusActions";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = await prisma.offer.findUnique({ where: { id }, include: { client: { select: { id: true, name: true } } } });
  if (!offer) notFound();

  return (
    <div className="hub-page">
      <div className="hub-detail-back"><Link href="/hub/offers"><ArrowLeft size={16} />Offers</Link></div>
      <div className="hub-page-header"><div><span className="hub-eyebrow">CLIENT OFFER</span><h1>{offer.title}</h1><p>Created {formatDate(offer.createdAt)}</p></div><span className={`hub-offer-status hub-offer-status-${offer.status.toLowerCase()}`}>{offerStatusLabels[offer.status]}</span></div>

      <section className="hub-client-stats">
        <div className="hub-client-stat"><span className="hub-client-stat-label">Website build</span><strong className="hub-offer-amount">{formatOfferAmount(offer.oneTimePriceOre)}</strong><small>One-time, excl. VAT</small></div>
        <div className="hub-client-stat"><span className="hub-client-stat-label">Hosting + support</span><strong className="hub-offer-amount">{formatOfferAmount(offer.monthlyPriceOre)}</strong><small>Monthly after agreed start, excl. VAT</small></div>
        <div className="hub-client-stat"><span className="hub-client-stat-label"><CalendarDays size={16} />Included support</span><strong>{offer.includedMonths}</strong><small>Months included in proposal</small></div>
      </section>

      <div className="hub-offer-detail-grid">
        <div className="hub-client-panel">
          <h2>{offer.status === "DRAFT" ? "Edit draft" : "Offer terms"}</h2>
          {offer.status === "DRAFT" ? <OfferForm offer={offer} clients={[offer.client]} /> : (
            <div className="hub-offer-terms">
              <h3>Scope and deliverables</h3><p>{offer.scope || "No scope provided."}</p>
              <h3>Additional terms</h3><p>{offer.terms || "No additional terms."}</p>
            </div>
          )}
        </div>
        <div className="hub-client-side">
          <div className="hub-client-panel"><h2>Client</h2><Link className="hub-offer-client-link" href={`/hub/clients/${offer.clientId}`}><Building2 size={16} />{offer.client.name}</Link></div>
          <div className="hub-client-panel"><h2>Decision</h2>
            <p className="hub-client-empty">The client can accept or decline from the secure offer link. The status updates automatically.</p>
            {offer.sharedAt && <p className="hub-offer-timestamp">Shared {formatDate(offer.sharedAt)}</p>}
            {offer.viewedAt && <p className="hub-offer-timestamp">Viewed {formatDate(offer.viewedAt)}</p>}
            {offer.decidedAt && <p className="hub-offer-timestamp">Decision {formatDate(offer.decidedAt)}</p>}
            {offer.status === "DRAFT" && <Link className="hub-secondary-button hub-offer-project-link" href={`/hub/offers/${offer.id}/send`}><Mail size={15} />Review and send offer</Link>}
            {offer.shareToken && offer.status !== "DRAFT" && <Link className="hub-secondary-button hub-offer-project-link" href={`/offert/${offer.shareToken}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />Open client offer</Link>}
            <OfferStatusActions offerId={offer.id} status={offer.status} />
            {offer.status === "ACCEPTED" && <Link className="hub-secondary-button hub-offer-project-link" href={`/hub/projects/new?clientId=${encodeURIComponent(offer.clientId)}`}><FolderKanban size={15} />Start a project</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
