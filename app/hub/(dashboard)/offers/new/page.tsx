import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import OfferForm from "../OfferForm";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    clientId?: string;
    leadId?: string;
  }>;
};

export default async function NewOfferPage({ searchParams }: PageProps) {
  const { clientId, leadId } = await searchParams;

  const [clients, lead] = await Promise.all([
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    leadId
      ? prisma.lead.findUnique({
          where: { id: leadId },
          select: {
            id: true,
            status: true,
            service: true,
            clientId: true,
            contact: {
              select: {
                name: true,
                company: true,
                email: true,
                phone: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  if (leadId && !lead) notFound();

  const leadLabel = lead
    ? `${lead.contact.company || lead.contact.name || lead.contact.email || lead.contact.phone || "Lead"}${lead.service ? ` · ${lead.service}` : ""}`
    : null;

  const canCreate = Boolean(lead) || clients.length > 0;

  return (
    <div className="hub-page sw-offer-new-page">
      <div className="hub-detail-back">
        <Link href={lead ? `/hub/leads/${lead.id}` : "/hub/offers"}>
          <ArrowLeft size={16} />
          {lead ? "Lead" : "Offers"}
        </Link>
      </div>

      <div className="hub-page-header sw-offer-new-header">
        <div>
          <h1>New offer</h1>
          <p>Choose a template, adjust the scope and pricing, then save a draft for review.</p>
        </div>
      </div>

      {!canCreate ? (
        <div className="hub-empty-state">
          <Building2 size={28} />
          <h2>Add a client first</h2>
          <p>Manual offers belong to a client. Offers started from a lead create the client automatically.</p>
          <Link href="/hub/clients/new" className="hub-secondary-button">New client</Link>
        </div>
      ) : (
        <div className="sw-offer-new-layout">
          <section className="hub-client-panel sw-offer-new-editor" aria-label="New offer editor">
            <div className="sw-offer-new-editor-head">
              <span className="sw-offer-new-eyebrow">PROPOSAL BUILDER</span>
              <h2>Prepare your proposal</h2>
              <p>Choose the client, configure the pricing, and describe what you will deliver.</p>
            </div>
            <OfferForm
              clients={clients}
              defaultClientId={clients.some((client) => client.id === clientId) ? clientId : undefined}
              lead={lead && leadLabel ? {
                id: lead.id,
                label: leadLabel,
                clientId: lead.clientId,
              } : undefined}
            />
          </section>
          <aside className="sw-offer-new-sidebar" aria-label="Offer creation guidance">
            <div className="sw-offer-new-guide">
              <span className="sw-offer-new-eyebrow">WORKFLOW</span>
              <h2>From proposal to project</h2>
              <ol>
                <li><strong>01 · Build</strong><span>Select a template and customize the scope, pricing and terms.</span></li>
                <li><strong>02 · Review</strong><span>Save the draft and check all details before sharing.</span></li>
                <li><strong>03 · Share</strong><span>Send the offer using the review-and-send workflow.</span></li>
                <li><strong>04 · Deliver</strong><span>After acceptance, connect the offer to a project.</span></li>
              </ol>
            </div>
            <div className="sw-offer-new-note">
              <strong>Draft first. Send when ready.</strong>
              <p>Creating an offer does not send an email or publish a client link.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
