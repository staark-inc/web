import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, ShieldCheck } from "lucide-react";

import { formatOfferAmount, offerStatusLabels } from "@/lib/offers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OfferAdminPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { client: { select: { name: true } } },
  });
  if (!offer) notFound();

  return (
    <main className="hub-page sw-offer-admin-preview">
      <div className="hub-detail-back">
        <Link href={`/hub/offers/${offer.id}/send`}><ArrowLeft size={16}/> Back to send</Link>
      </div>
      <header className="sw-offer-admin-preview-head">
        <div>
          <span className="sw-offer-detail-kicker"><Eye size={14}/> INTERNAL OFFER PREVIEW</span>
          <h1>{offer.title}</h1>
          <p>Preview the client-facing content before sending.</p>
        </div>
        <span className={`hub-offer-status hub-offer-status-${offer.status.toLowerCase()}`}>{offerStatusLabels[offer.status]}</span>
      </header>
      {offer.status === "DRAFT" && (
        <div className="sw-offer-admin-preview-notice">
          <ShieldCheck size={18}/>
          <span>This is a private preview. The public client link stays unavailable until the offer has been shared.</span>
        </div>
      )}
      <article className="sw-offer-admin-preview-paper">
        <div className="sw-offer-admin-preview-brand">STAARK INC. <span>OFFERT</span></div>
        <h2>{offer.title}</h2>
        <p className="sw-offer-admin-preview-client">För {offer.client.name}</p>
        <div className="sw-offer-admin-preview-prices">
          <div><span>Webbplats</span><strong>{formatOfferAmount(offer.oneTimePriceOre)}</strong><small>Engångspris, exkl. moms</small></div>
          <div><span>Hosting + support</span><strong>{formatOfferAmount(offer.monthlyPriceOre)}</strong><small>Per månad, exkl. moms</small></div>
          <div><span>Support ingår</span><strong>{offer.includedMonths} mån</strong><small>Enligt förslaget</small></div>
        </div>
        <section><h3>Omfattning och leverans</h3><p>{offer.scope || "Ingen omfattning angiven."}</p></section>
        {offer.terms && <section><h3>Villkor</h3><p>{offer.terms}</p></section>}
        <p className="sw-offer-admin-preview-footer">Preview only — acceptance and decline actions are intentionally disabled.</p>
      </article>
    </main>
  );
}
