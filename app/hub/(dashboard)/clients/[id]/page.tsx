import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  FolderKanban,
  LifeBuoy,
  Mail,
  Plus,
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

const leadStatusLabels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  WON: "Won",
  LOST: "Lost",
};

const projectStatusLabels: Record<string, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In progress",
  WAITING_CLIENT: "Waiting on client",
  REVIEW: "Review",
  COMPLETED: "Completed",
  MAINTENANCE: "Maintenance",
  CANCELLED: "Cancelled",
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

      projects: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          dueAt: true,
          tasks: {
            select: {
              done: true,
            },
          },
        },
      },

      offers: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          oneTimePriceOre: true,
        },
      },

      supportRequests: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
        },
        take: 20,
      },
    },
  });

  if (!client) {
    notFound();
  }

  const activeProjects = client.projects.filter(
    (project) =>
      project.status !== "COMPLETED" &&
      project.status !== "CANCELLED"
  ).length;

  const liveOffers = client.offers.filter(
    (offer) => offer.status === "SHARED" || offer.status === "VIEWED"
  ).length;

  const openSupport = client.supportRequests.filter(
    (request) => request.status !== "RESOLVED"
  ).length;

  return (
    <div className="hub-page hub-client-v2-detail-page">
      <div className="hub-detail-back">
        <Link href="/hub/clients">
          <ArrowLeft size={16} />
          Clients
        </Link>
      </div>

      <header className="hub-client-v2-detail-head">
        <div>
          <span className="hub-client-v2-detail-kicker">
            <Building2 size={12} />
            CLIENT WORKSPACE
          </span>

          <h1>{client.name}</h1>

          <p>
            Client since {formatDate(client.createdAt)}
            {client.billingEmail ? ` · ${client.billingEmail}` : ""}
          </p>
        </div>

        <div className="hub-client-v2-detail-actions">
          <Link href={`/hub/offers/new?clientId=${encodeURIComponent(client.id)}`}>
            <FileText size={14} />
            New offer
          </Link>

          <Link href={`/hub/support/new?clientId=${encodeURIComponent(client.id)}`}>
            <LifeBuoy size={14} />
            New support
          </Link>
        </div>
      </header>

      <section className="hub-client-v2-detail-stats">
        <div>
          <span><UserRound size={15} /> Contacts</span>
          <strong>{client.contacts.length}</strong>
          <small>Linked people</small>
        </div>

        <div>
          <span><FolderKanban size={15} /> Active projects</span>
          <strong>{activeProjects}</strong>
          <small>{client.projects.length} total project{client.projects.length === 1 ? "" : "s"}</small>
        </div>

        <div>
          <span><FileText size={15} /> Live offers</span>
          <strong>{liveOffers}</strong>
          <small>{client.offers.length} total offer{client.offers.length === 1 ? "" : "s"}</small>
        </div>

        <div className={openSupport ? "hub-client-v2-detail-stat-warning" : undefined}>
          <span><LifeBuoy size={15} /> Open support</span>
          <strong>{openSupport}</strong>
          <small>{openSupport ? "Needs follow-up" : "All clear"}</small>
        </div>
      </section>

      <section className="hub-client-v2-detail-grid">
        <div className="hub-client-v2-detail-column hub-client-v2-detail-column-main">
          <div className="hub-client-v2-panel">
            <div className="hub-client-v2-panel-head">
              <div>
                <span>DELIVERY</span>
                <h2>Projects</h2>
              </div>

              <Link href="/hub/projects/new">
                <Plus size={13} />
                New project
              </Link>
            </div>

            {client.projects.length === 0 ? (
              <p className="hub-client-empty">No projects linked to this client yet.</p>
            ) : (
              <div className="hub-client-v2-projects">
                {client.projects.map((project) => {
                  const done = project.tasks.filter((task) => task.done).length;
                  const totalTasks = project.tasks.length;
                  const progress = totalTasks
                    ? Math.round((done / totalTasks) * 100)
                    : 0;

                  return (
                    <Link
                      key={project.id}
                      href={`/hub/projects/${project.id}`}
                      className="hub-client-v2-project-row"
                    >
                      <span className="hub-client-v2-project-icon">
                        <FolderKanban size={15} />
                      </span>

                      <div className="hub-client-v2-project-main">
                        <strong>{project.name}</strong>
                        <span>{projectStatusLabels[project.status] ?? project.status}</span>
                      </div>

                      <div className="hub-client-v2-project-progress">
                        <span>{progress}%</span>
                        <div>
                          <i style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <div className="hub-client-v2-project-date">
                        <CalendarDays size={13} />
                        {project.dueAt ? formatDate(project.dueAt) : "No deadline"}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hub-client-v2-panel">
            <div className="hub-client-v2-panel-head">
              <div>
                <span>COMMERCIAL</span>
                <h2>Offers</h2>
              </div>

              <Link href={`/hub/offers/new?clientId=${encodeURIComponent(client.id)}`}>
                <Plus size={13} />
                New offer
              </Link>
            </div>

            {client.offers.length === 0 ? (
              <p className="hub-client-empty">No offers for this client yet.</p>
            ) : (
              <ul className="hub-client-v2-related-list">
                {client.offers.map((offer) => (
                  <li key={offer.id}>
                    <Link href={`/hub/offers/${offer.id}`}>
                      <strong>{offer.title}</strong>
                    </Link>
                    <span>{offerStatusLabels[offer.status]}</span>
                    <small>{formatOfferAmount(offer.oneTimePriceOre)}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="hub-client-v2-detail-column">
          <div className="hub-client-v2-panel">
            <div className="hub-client-v2-panel-head">
              <div>
                <span>PEOPLE</span>
                <h2>Contacts</h2>
              </div>
            </div>

            {client.contacts.length === 0 ? (
              <p className="hub-client-empty">No contacts linked to this client.</p>
            ) : (
              <ul className="hub-client-v2-related-list hub-client-v2-contact-list">
                {client.contacts.map((contact) => (
                  <li key={contact.id}>
                    <strong>{contact.name ?? contact.email}</strong>
                    <span>
                      <Mail size={12} />
                      {contact.email}
                    </span>
                    {contact.phone && <small>{contact.phone}</small>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="hub-client-v2-panel">
            <div className="hub-client-v2-panel-head">
              <div>
                <span>SERVICE</span>
                <h2>Support</h2>
              </div>

              <Link href={`/hub/support/new?clientId=${encodeURIComponent(client.id)}`}>
                <Plus size={13} />
                New
              </Link>
            </div>

            {client.supportRequests.length === 0 ? (
              <p className="hub-client-empty">No support requests yet.</p>
            ) : (
              <ul className="hub-client-v2-related-list">
                {client.supportRequests.map((request) => (
                  <li key={request.id}>
                    <Link href={`/hub/support/${request.id}`}>
                      <strong>{request.title}</strong>
                    </Link>
                    <span>{supportStatusLabels[request.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="hub-client-v2-panel">
            <div className="hub-client-v2-panel-head">
              <div>
                <span>HISTORY</span>
                <h2>Leads</h2>
              </div>
            </div>

            {client.leads.length === 0 ? (
              <p className="hub-client-empty">No leads linked to this client.</p>
            ) : (
              <ul className="hub-client-v2-related-list">
                {client.leads.map((lead) => (
                  <li key={lead.id}>
                    <Link href={`/hub/leads/${lead.id}`}>
                      <strong>{lead.service ?? "Lead"}</strong>
                    </Link>
                    <span>{leadStatusLabels[lead.status] ?? lead.status}</span>
                    <small>
                      {lead.budget ? formatAmount(lead.budget) : formatDate(lead.createdAt)}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="hub-client-v2-settings">
        <details>
          <summary>
            <span>
              <strong>Client details</strong>
              <small>Billing, organization, phone, address and internal notes</small>
            </span>
            <span>Edit</span>
          </summary>

          <div className="hub-client-v2-settings-body">
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
        </details>
      </section>
    </div>
  );
}
