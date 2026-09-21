import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  LifeBuoy,
  Mail,
  Target,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/format";
import { formatOfferAmount, offerStatusLabels } from "@/lib/offers";
import { supportStatusLabels } from "@/lib/support";

import ClientForm from "../ClientForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const statusLabels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  WON: "Won",
  LOST: "Lost",
};

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contacts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },

      leads: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          service: true,
          budget: true,
          status: true,
          createdAt: true,
        },
      },

      offers: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, oneTimePriceOre: true },
      },
      supportRequests: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true },
        take: 20,
      },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="hub-page">
      <div className="hub-detail-back">
        <Link href="/hub/clients">
          <ArrowLeft size={16} />
          Clients
        </Link>
      </div>

      <div className="hub-page-header">
        <div>
          <h1>{client.name}</h1>

          <p>
            Client since {formatDate(client.createdAt)}
          </p>
        </div>
      </div>

      <section className="hub-client-detail-grid">
        <div className="hub-client-panel">
          <h2>Client details</h2>

          <ClientForm
            client={{
              id: client.id,
              name: client.name,
              billingEmail: client.billingEmail,
              phone: client.phone,
              organizationNumber: client.organizationNumber,
              billingAddress: client.billingAddress,
              notes: client.notes,
            }}
          />
        </div>

        <div className="hub-client-side">
          <div className="hub-client-panel">
            <h2>
              <UserRound size={16} />
              Contacts ({client.contacts.length})
            </h2>

            {client.contacts.length === 0 ? (
              <p className="hub-client-empty">
                No contacts linked to this client.
              </p>
            ) : (
              <ul className="hub-client-related">
                {client.contacts.map((contact) => (
                  <li key={contact.id}>
                    <strong>
                      {contact.name ?? contact.email}
                    </strong>

                    <span>
                      <Mail size={13} />
                      {contact.email}
                    </span>

                    {contact.phone && <span>{contact.phone}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="hub-client-panel">
            <h2>
              <Target size={16} />
              Leads ({client.leads.length})
            </h2>

            {client.leads.length === 0 ? (
              <p className="hub-client-empty">
                No leads linked to this client.
              </p>
            ) : (
              <ul className="hub-client-related">
                {client.leads.map((lead) => (
                  <li key={lead.id}>
                    <Link href={`/hub/leads/${lead.id}`}>
                      <strong>
                        {lead.service ?? "Lead"}
                      </strong>
                    </Link>

                    <span>
                      {statusLabels[lead.status] ?? lead.status}
                      {lead.budget ? ` · ${formatAmount(lead.budget)}` : ""}
                    </span>

                    <time dateTime={lead.createdAt.toISOString()}>
                      {formatDate(lead.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="hub-client-panel">
            <h2><FileText size={16} />Offers ({client.offers.length})</h2>
            {client.offers.length === 0 ? (
              <p className="hub-client-empty"><Link href={`/hub/offers/new?clientId=${encodeURIComponent(client.id)}`}>Create an offer for this client</Link></p>
            ) : (
              <ul className="hub-client-related">
                {client.offers.map((offer) => (
                  <li key={offer.id}>
                    <Link href={`/hub/offers/${offer.id}`}><strong>{offer.title}</strong></Link>
                    <span>{offerStatusLabels[offer.status]} · {formatOfferAmount(offer.oneTimePriceOre)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="hub-client-panel">
            <h2><LifeBuoy size={16} />Support requests</h2>
            {client.supportRequests.length === 0 ? (
              <p className="hub-client-empty">No requests yet.</p>
            ) : (
              <ul className="hub-client-related">
                {client.supportRequests.map((request) => <li key={request.id}><Link href={`/hub/support/${request.id}`}><strong>{request.title}</strong></Link><span>{supportStatusLabels[request.status]}</span></li>)}
              </ul>
            )}
            <Link className="hub-secondary-button hub-support-create-link" href={`/hub/support/new?clientId=${encodeURIComponent(client.id)}`}>New support request</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
