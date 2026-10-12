import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, ExternalLink, FolderKanban, Mail, Target } from "lucide-react";

import { formatOfferAmount, offerStatusLabels } from "@/lib/offers";
import { prisma } from "@/lib/prisma";
import OfferForm from "../OfferForm";
import OfferStatusActions from "../OfferStatusActions";
import OfferDeleteButton from "../OfferDeleteButton";
import "../../../offer-decision-polish.css";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      lead: { select: { id: true, service: true, status: true } },
      project: { select: { id: true, name: true } },
    },
  });
  if (!offer) notFound();

  return (
    <div className="hub-page sw-offer-detail-page">
      <div className="hub-detail-back"><Link href="/hub/offers"><ArrowLeft size={16} />Offers</Link></div>
      <div className="hub-page-header sw-offer-detail-header"><div><span className="hub-eyebrow">CLIENT OFFER</span><h1>{offer.title}</h1><p>Created {formatDate(offer.createdAt)}</p></div><span className={`hub-offer-status hub-offer-status-${offer.status.toLowerCase()}`}>{offerStatusLabels[offer.status]}</span></div>

      <section className="sw-offer-detail-summary" aria-label="Offer summary">
        <div className="sw-offer-detail-pricing">
          <span className="sw-offer-detail-kicker">PROPOSAL VALUE</span>
          <strong>{formatOfferAmount(offer.oneTimePriceOre)}</strong>
          <span>One-time project fee · excluding VAT</span>
          <div className="sw-offer-detail-pricing-foot">
            <div><small>Recurring</small><b>{offer.monthlyPriceOre === null ? "Not specified" : `${formatOfferAmount(offer.monthlyPriceOre)}/mo`}</b></div>
            <div><small>Included support</small><b>{offer.includedMonths} months</b></div>
          </div>
        </div>
        <div className="sw-offer-detail-history">
          <div className="sw-offer-detail-history-head">
            <span className="sw-offer-detail-kicker">CLIENT JOURNEY</span>
            <span className={`hub-offer-status hub-offer-status-${offer.status.toLowerCase()}`}>{offerStatusLabels[offer.status]}</span>
          </div>
          <ol>
            <li className="is-complete"><span>Created</span><strong>{formatDate(offer.createdAt)}</strong></li>
            <li className={offer.sharedAt ? "is-complete" : ""}><span>Shared</span><strong>{offer.sharedAt ? formatDate(offer.sharedAt) : "Not yet shared"}</strong></li>
            <li className={offer.viewedAt ? "is-complete" : ""}><span>Viewed</span><strong>{offer.viewedAt ? formatDate(offer.viewedAt) : "Awaiting client view"}</strong></li>
            <li className={offer.decidedAt ? "is-complete" : ""}><span>Decision</span><strong>{offer.decidedAt ? formatDate(offer.decidedAt) : "Pending"}</strong></li>
          </ol>
        </div>
      </section>

      <div className="hub-offer-detail-grid sw-offer-detail-content">
        <div className="hub-client-panel sw-offer-editor-panel sw-card sw-card-panel">
          <div className="sw-offer-section-heading"><div><span className="sw-offer-detail-kicker">PROPOSAL CONTENT</span><h2>{offer.status === "DRAFT" ? "Edit draft" : "Offer terms"}</h2></div><span>{offer.status === "DRAFT" ? "Draft — editable" : "Read only after sending"}</span></div>
          {offer.status === "DRAFT" ? <OfferForm offer={offer} clients={[offer.client]} /> : (
            <div className="hub-offer-terms">
              <h3>Scope and deliverables</h3><p>{offer.scope || "No scope provided."}</p>
              <h3>Additional terms</h3><p>{offer.terms || "No additional terms."}</p>
            </div>
          )}
        </div>
        <div className="hub-client-side sw-offer-detail-sidebar">
          <div className="hub-client-panel sw-offer-detail-client sw-card sw-card-panel">
            <h2>Client</h2>
            <Link className="hub-offer-client-link" href={`/hub/clients/${offer.clientId}`}><Building2 size={16} />{offer.client.name}</Link>
            {offer.lead && (
              <Link className="hub-offer-client-link" href={`/hub/leads/${offer.lead.id}`}>
                <Target size={16} />
                {offer.lead.service || "Linked lead"} · {offer.lead.status}
              </Link>
            )}
          </div>
          <div className="hub-client-panel sw-offer-detail-actions-panel sw-card sw-card-panel"><h2>Actions &amp; decision</h2>
            <p className="hub-client-empty">The client can accept or decline from the secure offer link. Linked leads become won automatically when the offer is accepted.</p>
            {offer.sharedAt && <p className="hub-offer-timestamp hub-offer-timestamp-shared">Shared {formatDate(offer.sharedAt)}</p>}
            {offer.viewedAt && <p className="hub-offer-timestamp hub-offer-timestamp-viewed">Viewed {formatDate(offer.viewedAt)}</p>}
            {offer.decidedAt && <p className="hub-offer-timestamp hub-offer-timestamp-decided">Decision {formatDate(offer.decidedAt)}</p>}

            <div className="hub-offer-decision-actions">
              {offer.status === "DRAFT" && (
                <Link className="hub-offer-decision-primary" href={`/hub/offers/${offer.id}/send`}>
                  <Mail size={15} />
                  Review and send offer
                </Link>
              )}

              {offer.shareToken && offer.status !== "DRAFT" && (
                <Link
                  className="hub-offer-decision-primary"
                  href={`/offert/${offer.shareToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={15} />
                  Open client offer
                </Link>
              )}

              <div className="hub-offer-decision-admin-row">
                <OfferStatusActions offerId={offer.id} status={offer.status} />

                <OfferDeleteButton
                  offerId={offer.id}
                  disabled={
                    Boolean(offer.project) ||
                    !["DRAFT", "DECLINED"].includes(offer.status)
                  }
                  disabledReason={
                    offer.project
                      ? "Offers linked to a project cannot be deleted."
                      : !["DRAFT", "DECLINED"].includes(offer.status)
                        ? "Only draft or declined offers can be deleted."
                        : undefined
                  }
                />
              </div>

              {offer.status === "ACCEPTED" && (
                offer.project ? (
                  <Link
                    className="hub-offer-decision-button hub-offer-decision-project"
                    href={`/hub/projects/${offer.project.id}`}
                  >
                    <FolderKanban size={15} />
                    Open project
                  </Link>
                ) : (
                  <Link
                    className="hub-offer-decision-button hub-offer-decision-project"
                    href={`/hub/projects/new?clientId=${encodeURIComponent(offer.clientId)}&offerId=${encodeURIComponent(offer.id)}`}
                  >
                    <FolderKanban size={15} />
                    Start a project
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
