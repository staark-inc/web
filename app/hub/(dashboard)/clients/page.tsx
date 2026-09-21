import Link from "next/link";
import {
  Building2,
  Mail,
  Plus,
  Target,
  UsersRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ClientsPage() {
  const [clients, totalClients, linkedContacts, convertedLeads] =
    await Promise.all([
      prisma.client.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          billingEmail: true,
          createdAt: true,
          contacts: {
            select: {
              id: true,
              email: true,
            },
          },
          _count: {
            select: { leads: true },
          },
        },
      }),

      prisma.client.count(),

      prisma.contact.count({
        where: { clients: { some: {} } },
      }),

      prisma.lead.count({
        where: { clientId: { not: null } },
      }),
    ]);

  return (
    <div className="hub-page">
      <div className="hub-page-header">
        <div>
          <h1>Clients</h1>

          <p>
            Companies you work with, their contacts
            and commercial details.
          </p>
        </div>

        <Link href="/hub/clients/new" className="hub-send-button">
          <Plus size={15} />
          New client
        </Link>
      </div>

      <section className="hub-client-stats">
        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <Building2 size={16} />
            Clients
          </span>

          <strong>{totalClients}</strong>

          <small>Confirmed client records</small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <UsersRound size={16} />
            Linked contacts
          </span>

          <strong>{linkedContacts}</strong>

          <small>People connected to clients</small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <Target size={16} />
            Converted leads
          </span>

          <strong>{convertedLeads}</strong>

          <small>Leads linked to clients</small>
        </div>
      </section>

      {clients.length === 0 ? (
        <div className="hub-empty-state">
          <Building2 size={28} />

          <h2>No clients yet</h2>

          <p>
            Once a lead becomes a client, their company
            and contacts will appear here.
          </p>

          <Link href="/hub/clients/new" className="hub-secondary-button">
            New client
          </Link>
        </div>
      ) : (
        <div className="hub-client-list">
          {clients.map((client) => {
            const email =
              client.billingEmail ??
              client.contacts[0]?.email ??
              null;

            return (
              <Link
                key={client.id}
                href={`/hub/clients/${client.id}`}
                className="hub-client-row"
              >
                <div className="hub-client-avatar">
                  {getInitials(client.name) || <Building2 size={17} />}
                </div>

                <div className="hub-client-main">
                  <strong>{client.name}</strong>

                  <span className="hub-client-email">
                    {email ? (
                      <>
                        <Mail size={13} />
                        {email}
                      </>
                    ) : (
                      "No email added"
                    )}
                  </span>
                </div>

                <div className="hub-client-meta">
                  <span>
                    {client.contacts.length}{" "}
                    {client.contacts.length === 1
                      ? "contact"
                      : "contacts"}
                  </span>

                  <span>
                    {client._count.leads}{" "}
                    {client._count.leads === 1 ? "lead" : "leads"}
                  </span>

                  <time dateTime={client.createdAt.toISOString()}>
                    {formatDate(client.createdAt)}
                  </time>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
