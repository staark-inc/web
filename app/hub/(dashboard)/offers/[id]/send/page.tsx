import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ComposeForm from "../../../compose/ComposeForm";
import {
  getEmailTemplate,
  renderEmailTemplate,
} from "@/lib/email-templates";
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
          contacts: {
            select: { email: true, name: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
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

  const publicOfferUrl = `${siteUrl}/offert/${shareToken}`;
  const backToOffer = `/hub/offers/${id}`;
  const ready = Boolean(
    offer.scope &&
      (offer.oneTimePriceOre !== null || offer.monthlyPriceOre !== null)
  );
  const clientEmail =
    offer.client.contacts[0]?.email ?? offer.client.billingEmail ?? "";
  const recipient = /@example\.(com|org|net)$/i.test(clientEmail)
    ? ""
    : clientEmail;

  const template = await getEmailTemplate("OFFER_SHARED");
  const pricing = [
    ...(offer.oneTimePriceOre !== null
      ? [
          `Engångspris för webbplatsen: ${formatOfferAmount(
            offer.oneTimePriceOre
          )} exkl. moms.`,
        ]
      : []),
    ...(offer.monthlyPriceOre !== null
      ? [
          `Hosting och support: ${formatOfferAmount(
            offer.monthlyPriceOre
          )}/månad exkl. moms.`,
        ]
      : []),
  ].join("\n");

  const values = {
    clientName: offer.client.contacts[0]?.name || offer.client.name,
    companyName: offer.client.name,
    offerTitle: offer.title,
    offerScope: offer.scope ?? "",
    pricing,
    includedMonths: offer.includedMonths,
    termsSection: offer.terms ? `Villkor\n${offer.terms}\n\n` : "",
    offerUrl: publicOfferUrl,
    senderName: "Staark Inc.",
  };

  const subject = template.active
    ? renderEmailTemplate(template.subject, values)
    : `Förslag: ${offer.title}`;
  const body = template.active
    ? renderEmailTemplate(template.body, values)
    : "";

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
            initialSubject={subject}
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
