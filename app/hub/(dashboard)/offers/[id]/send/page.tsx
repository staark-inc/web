import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ComposeForm from "../../../compose/ComposeForm";
import { formatOfferAmount } from "@/lib/offers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SendOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          name: true,
          billingEmail: true,
          contacts: { select: { email: true }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!offer) notFound();

  let shareToken = offer.shareToken;

  if (!shareToken) {
    shareToken = randomUUID();

    await prisma.offer.update({
      where: { id: offer.id },
      data: { shareToken },
    });
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://staarkinc.com"
  ).replace(/\/$/, "");

  const publicOfferUrl =
    `${siteUrl}/offert/${shareToken}`;

  const backToOffer = `/hub/offers/${id}`;
  const ready = Boolean(offer.scope && (offer.oneTimePriceOre !== null || offer.monthlyPriceOre !== null));
  const clientEmail = offer.client.contacts[0]?.email ?? offer.client.billingEmail ?? "";
  // Sample contacts are often imported with example.com addresses. Never prefill those for sending.
  const recipient = /@example\.(com|org|net)$/i.test(clientEmail) ? "" : clientEmail;
  const body = [
    "Hej!",
    "",
    `Här kommer vårt förslag för ${offer.client.name}: ${offer.title}.`,
    "",
    "Omfattning",
    offer.scope ?? "",
    "",
    ...(offer.oneTimePriceOre !== null
      ? [`Engångspris för webbplatsen: ${formatOfferAmount(offer.oneTimePriceOre)} exkl. moms.`]
      : []),
    ...(offer.monthlyPriceOre !== null
      ? [`Hosting och support: ${formatOfferAmount(offer.monthlyPriceOre)}/månad exkl. moms.`]
      : []),
    `Support ingår i ${offer.includedMonths} månader enligt förslaget.`,
    ...(offer.terms ? ["", "Villkor", offer.terms] : []),
    "",
    "Se hela offerten och svara direkt här:",
    publicOfferUrl,
    "",
    "Återkom gärna om ni vill gå igenom förslaget tillsammans eller har några frågor.",
    "",
    "Vänliga hälsningar,",
    "Staark Inc.",
  ].join("\n");

  return (
    <div className="hub-page hub-compose-page">
      <header className="hub-page-header">
        <div>
          <Link className="hub-back" href={backToOffer}><ArrowLeft size={16} />Offer</Link>
          <h1>Send offer</h1>
          <p>Review the price, terms and recipient before sending to {offer.client.name}.</p>
        </div>
      </header>
      {offer.status !== "DRAFT" ? (
        <div className="hub-client-panel">This offer is {offer.status.toLowerCase()}. Revise it as a draft before sending again.</div>
      ) : !ready ? (
        <div className="hub-client-panel">Add the scope and at least one price to the draft before sending it.</div>
      ) : (
        <>
          {!recipient && <p className="hub-offer-send-note">Enter an email address you control for this demo. Sample example.com addresses cannot receive the offer.</p>}
          <ComposeForm
            initialTo={recipient}
            initialSubject={`Förslag: ${offer.title}`}
            initialMessage={body}
            returnTo={backToOffer}
            confirmRecipient
            offerId={offer.id}
          />
        </>
      )}
    </div>
  );
}
