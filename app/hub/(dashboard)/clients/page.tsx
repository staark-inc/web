import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FileText,
  FolderKanban,
  LifeBuoy,
  Mail,
  Plus,
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
  const [
    clients,
    totalClients,
    linkedContacts,
    activeProjects,
    liveOffers,
    openSupport,
  ] = await Promise.all([
    prisma.client.findMany({
      orderBy: { updatedAt: "desc" },
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
        projects: {
          select: {
            status: true,
          },
        },
        offers: {
          select: {
            status: true,
          },
        },
        supportRequests: {
          select: {
            status: true,
          },
        },
      },
    }),

    prisma.client.count(),

    prisma.contact.count({
      where: { clients: { some: {} } },
    }),

    prisma.project.count({
      where: {
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
    }),

    prisma.offer.count({
      where: {
        status: {
          in: ["SHARED", "VIEWED"],
        },
      },
    }),

    prisma.supportRequest.count({
      where: {
        status: {
          not: "RESOLVED",
        },
      },
    }),
  ]);

  return (
    <div className="hub-page hub-clients-v2-page">
      <header className="hub-clients-v2-head">
        <div>
          <span className="hub-clients-v2-kicker">CUSTOMERS / CRM</span>
          <h1>Clients</h1>
          <p>
            Keep customer relationships, delivery and commercial activity in one place.
          </p>
        </div>

        <Link href="/hub/clients/new" className="hub-clients-v2-new">
          <Plus size={15} />
          New client
        </Link>
      </header>

      <section className="hub-clients-v2-stats" aria-label="Client overview">
        <div className="hub-clients-v2-stat">
          <span className="hub-clients-v2-stat-icon">
            <Building2 size={16} />
          </span>
          <div>
            <small>Clients</small>
            <strong>{totalClients}</strong>
            <span>Confirmed records</span>
          </div>
        </div>

        <div className="hub-clients-v2-stat">
          <span className="hub-clients-v2-stat-icon">
            <UsersRound size={16} />
          </span>
          <div>
            <small>Contacts</small>
            <strong>{linkedContacts}</strong>
            <span>Linked people</span>
          </div>
        </div>

        <div className="hub-clients-v2-stat">
          <span className="hub-clients-v2-stat-icon">
            <FolderKanban size={16} />
          </span>
          <div>
            <small>Active delivery</small>
            <strong>{activeProjects}</strong>
            <span>Open projects</span>
          </div>
        </div>

        <div className={`hub-clients-v2-stat ${openSupport ? "hub-clients-v2-stat-warning" : ""}`}>
          <span className="hub-clients-v2-stat-icon">
            <LifeBuoy size={16} />
          </span>
          <div>
            <small>Open support</small>
            <strong>{openSupport}</strong>
            <span>{liveOffers} live offer{liveOffers === 1 ? "" : "s"}</span>
          </div>
        </div>
      </section>

      {clients.length === 0 ? (
        <div className="hub-empty-state">
          <Building2 size={28} />
          <h2>No clients yet</h2>
          <p>
            Once a lead becomes a client, their company and activity will appear here.
          </p>
          <Link href="/hub/clients/new" className="hub-secondary-button">
            New client
          </Link>
        </div>
      ) : (
        <section className="hub-clients-v2-list" aria-label="Clients">
          {clients.map((client) => {
            const email =
              client.billingEmail ??
              client.contacts[0]?.email ??
              null;

            const activeProjectCount = client.projects.filter(
              (project) =>
                project.status !== "COMPLETED" &&
                project.status !== "CANCELLED"
            ).length;

            const liveOfferCount = client.offers.filter(
              (offer) => offer.status === "SHARED" || offer.status === "VIEWED"
            ).length;

            const openSupportCount = client.supportRequests.filter(
              (request) => request.status !== "RESOLVED"
            ).length;

            return (
              <article key={client.id} className="hub-clients-v2-row">
                <div className="hub-clients-v2-main">
                  <div className="hub-clients-v2-avatar">
                    {getInitials(client.name) || <Building2 size={17} />}
                  </div>

                  <div className="hub-clients-v2-identity">
                    <Link href={`/hub/clients/${client.id}`}>
                      {client.name}
                    </Link>

                    <span>
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
                </div>

                <div className="hub-clients-v2-signals">
                  <span>
                    <UsersRound size={13} />
                    {client.contacts.length} contact{client.contacts.length === 1 ? "" : "s"}
                  </span>

                  <span className={activeProjectCount ? "hub-clients-v2-signal-active" : undefined}>
                    <FolderKanban size={13} />
                    {activeProjectCount} active project{activeProjectCount === 1 ? "" : "s"}
                  </span>

                  <span className={liveOfferCount ? "hub-clients-v2-signal-info" : undefined}>
                    <FileText size={13} />
                    {liveOfferCount} live offer{liveOfferCount === 1 ? "" : "s"}
                  </span>

                  <span className={openSupportCount ? "hub-clients-v2-signal-warning" : undefined}>
                    <LifeBuoy size={13} />
                    {openSupportCount} open support
                  </span>
                </div>

                <div className="hub-clients-v2-tail">
                  <time dateTime={client.createdAt.toISOString()}>
                    Client since {formatDate(client.createdAt)}
                  </time>

                  <Link href={`/hub/clients/${client.id}`}>
                    Open
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
