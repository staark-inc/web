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
    <div className="hub-page">
      <div className="hub-detail-back">
        <Link href={lead ? `/hub/leads/${lead.id}` : "/hub/offers"}>
          <ArrowLeft size={16} />
          {lead ? "Lead" : "Offers"}
        </Link>
      </div>

      <div className="hub-page-header">
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
        <section className="hub-client-panel">
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
      )}
    </div>
  );
}
