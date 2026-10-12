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
import { ActionLink, WorkspacePage, PageHeader, Metrics, Metric, ExpandableCard } from "@/components/hub/workspace";

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
    <WorkspacePage>
      <div className="sw-clients-page">
        <PageHeader eyebrow="CUSTOMERS / CRM" title="Clients"
          description="Manage client relationships, active delivery, offers and support in one workspace."
          action={<ActionLink href="/hub/clients/new"><Plus size={16}/> New client</ActionLink>}/>
        <Metrics label="Client overview">
          <Metric label="Clients" value={totalClients} description="Confirmed customer records" icon={<Building2 size={18}/>}/>
          <Metric label="Linked contacts" value={linkedContacts} description="People connected to clients" icon={<UsersRound size={18}/>}/>
          <Metric label="Active projects" value={activeProjects} description="Delivery in progress" icon={<FolderKanban size={18}/>}/>
          <Metric label="Open support" value={openSupport} description={`${liveOffers} live offers`} icon={<LifeBuoy size={18}/>}/>
        </Metrics>
        <div className="sw-client-workspace-heading">
          <div><span className="sw-eyebrow">YOUR ACCOUNTS</span><h2>Client portfolio</h2><p>Expand a client to review ongoing work before opening their complete record.</p></div>
          <span className="sw-client-count">{clients.length} clients</span>
        </div>
      {clients.length === 0 ? (
        <div className="hub-empty-state">
          <Building2 size={28} />
          <h2>No clients yet</h2>
          <p>
            Once a lead becomes a client, their company and activity will appear here.
          </p>
          <ActionLink href="/hub/clients/new" variant="secondary">
            New client
          </ActionLink>
        </div>
      ) : (
        <section className="sw-client-portfolio" aria-label="Clients">
          {clients.map((client) => {
            const email = client.billingEmail ?? client.contacts[0]?.email ?? null;
            const activeProjectCount = client.projects.filter(project => project.status !== "COMPLETED" && project.status !== "CANCELLED").length;
            const liveOfferCount = client.offers.filter(offer => offer.status === "SHARED" || offer.status === "VIEWED").length;
            const openSupportCount = client.supportRequests.filter(request => request.status !== "RESOLVED").length;
            return (
              <ExpandableCard key={client.id} className="sw-client-account">
                <summary>
                  <span className="sw-client-avatar">{getInitials(client.name) || <Building2 size={17}/>}</span>
                  <span className="sw-client-identity"><strong>{client.name}</strong><small>{email || "No billing email added"}</small></span>
                  <span className="sw-client-health">
                    <span><FolderKanban size={14}/>{activeProjectCount} projects</span>
                    <span><FileText size={14}/>{liveOfferCount} offers</span>
                    {openSupportCount > 0 && <span className="is-attention"><LifeBuoy size={14}/>{openSupportCount} support</span>}
                  </span>
                  <span className="sw-client-open">Details <ArrowRight size={16}/></span>
                </summary>
                <div className="sw-client-account-detail">
                  <div><span className="sw-eyebrow">RELATIONSHIP</span><h3>{client.name}</h3>
                    <p><Mail size={15}/>{email || "No email on record"}</p>
                    <p><UsersRound size={15}/>{client.contacts.length} linked contacts</p>
                    <p>Client since {formatDate(client.createdAt)}</p>
                  </div>
                  <div className="sw-client-detail-actions">
                    <span className="sw-eyebrow">NEXT ACTION</span>
                    {email && <Link href={`/hub/compose?replyTo=${encodeURIComponent(email)}`}><Mail size={15}/> Compose email</Link>}
                    <Link className="sw-client-primary-action" href={`/hub/clients/${client.id}`}>Open client workspace <ArrowRight size={16}/></Link>
                  </div>
                </div>
              </ExpandableCard>
            );
          })}
        </section>
      )}
      </div>
    </WorkspacePage>
  );
}
