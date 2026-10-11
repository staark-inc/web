import { WorkspaceTabs } from "@/components/hub/WorkspaceTabs";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Globe2,
  Mail,
  MessageSquareText,
  Phone,
  Search as SearchIcon,
  Target,
  UserRound,
  UsersRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { WorkspacePage, PageHeader, Metrics, Metric, InfoChip } from "@/components/hub/workspace";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    filter?: string;
  }>;
};

const CONTACT_FILTERS = ["all", "leads", "clients", "unlinked"] as const;
type ContactFilter = (typeof CONTACT_FILTERS)[number];

function getInitials(name: string | null, fallback: string | null) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  return (fallback || "??").slice(0, 2).toUpperCase();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getFilterHref(filter: ContactFilter, q: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/hub/contacts?${query}` : "/hub/contacts";
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const requestedFilter = params.filter ?? "all";
  const filter: ContactFilter = CONTACT_FILTERS.includes(requestedFilter as ContactFilter)
    ? (requestedFilter as ContactFilter)
    : "all";

  const contacts = await prisma.contact.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { leads: true, clients: true, messages: true } },
    },
  });

  const normalizedQuery = q.toLocaleLowerCase("sv-SE");
  const filteredContacts = contacts.filter((contact) => {
    const matchesQuery =
      !normalizedQuery ||
      [contact.name, contact.email, contact.phone, contact.facebook, contact.company].some((value) =>
        value?.toLocaleLowerCase("sv-SE").includes(normalizedQuery)
      );

    if (!matchesQuery) return false;
    if (filter === "leads") return contact._count.leads > 0;
    if (filter === "clients") return contact._count.clients > 0;
    if (filter === "unlinked") return contact._count.leads === 0 && contact._count.clients === 0;
    return true;
  });

  const contactsWithLeads = contacts.filter((contact) => contact._count.leads > 0).length;
  const contactsWithClients = contacts.filter((contact) => contact._count.clients > 0).length;
  const totalMessages = contacts.reduce((total, contact) => total + contact._count.messages, 0);

  return (
    <WorkspacePage>
      <div className="sw-contacts-page">
        <PageHeader eyebrow="PEOPLE / CRM" title="Contacts"
          description="Find people, review their relationship with Staark and take the next step."
          action={<InfoChip tone="info"><UsersRound size={15}/>{contacts.length} contacts</InfoChip>}/>
        <Metrics label="Contact overview">
          <Metric label="Total contacts" value={contacts.length} description="People in your CRM" icon={<UserRound size={18}/>}/>
          <Metric label="With leads" value={contactsWithLeads} description="Commercial enquiries" icon={<Target size={18}/>}/>
          <Metric label="Linked clients" value={contactsWithClients} description="Customer relationships" icon={<Building2 size={18}/>}/>
          <Metric label="Messages" value={totalMessages} description="Linked messages" icon={<MessageSquareText size={18}/>}/>
        </Metrics>
        <div className="sw-contacts-directory-heading">
          <div><span className="sw-eyebrow">YOUR NETWORK</span><h2>Contact directory</h2></div>
          <span>{filteredContacts.length} shown</span>
        </div>
      <section className="hub-contacts-v2-tools" aria-label="Contact filters">
        <form className="hub-contacts-v2-search" action="/hub/contacts">
          {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          <SearchIcon size={15} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, email, phone, Facebook or company..."
            aria-label="Search contacts"
          />
        </form>

        <WorkspaceTabs label="Contact status" activeKey={filter}
          tabs={[
            { key: "all", label: "All", href: getFilterHref("all", q), count: contacts.length },
            { key: "leads", label: "Leads", href: getFilterHref("leads", q), count: contactsWithLeads },
            { key: "clients", label: "Clients", href: getFilterHref("clients", q), count: contactsWithClients },
            { key: "unlinked", label: "Unlinked", href: getFilterHref("unlinked", q),
              count: contacts.filter((item) => item._count.leads === 0 && item._count.clients === 0).length },
          ]}/>

      </section>

      {filteredContacts.length === 0 ? (
        <div className="hub-contacts-v2-empty">
          <UserRound size={26} />
          <h2>{contacts.length === 0 ? "No contacts yet" : "No matches"}</h2>
          <p>{contacts.length === 0 ? "New contacts will appear here after the first enquiry or conversation." : "Try another search term or switch the current filter."}</p>
          {contacts.length > 0 ? <Link href="/hub/contacts" className="hub-secondary-button">Clear filters</Link> : null}
        </div>
      ) : (
        <section className="sw-contact-directory" aria-label="Contacts">
          {filteredContacts.map((contact) => {
            const fallback = contact.email || contact.phone || contact.facebook || contact.company;
            return (
              <details key={contact.id} className="sw-contact-entry">
                <summary>
                  <span className="sw-contact-avatar">{getInitials(contact.name, fallback)}</span>
                  <span className="sw-contact-person">
                    <strong>{contact.name || contact.company || "Unknown contact"}</strong>
                    <small>{contact.email || contact.phone || contact.company || "No contact details"}</small>
                  </span>
                  <span className="sw-contact-relations">
                    {contact._count.clients > 0 ? <InfoChip tone="success">Client</InfoChip> :
                      contact._count.leads > 0 ? <InfoChip tone="info">Lead</InfoChip> :
                      <InfoChip>Unlinked</InfoChip>}
                    <span>{contact._count.messages} messages</span>
                  </span>
                  <span className="sw-contact-entry-open">Details <ArrowRight size={15}/></span>
                </summary>
                <div className="sw-contact-entry-detail">
                  <div className="sw-contact-details">
                    <span className="sw-eyebrow">CONTACT INFORMATION</span>
                    {contact.email && <p><Mail size={15}/>{contact.email}</p>}
                    {contact.phone && <p><Phone size={15}/>{contact.phone}</p>}
                    {contact.company && <p><Building2 size={15}/>{contact.company}</p>}
                    {contact.facebook && <p><Globe2 size={15}/>Facebook profile recorded</p>}
                    <small>Added {formatDate(contact.createdAt)}</small>
                  </div>
                  <div className="sw-contact-quick">
                    <span className="sw-eyebrow">NEXT ACTION</span>
                    {contact.email && <Link href={`/hub/compose?replyTo=${encodeURIComponent(contact.email)}`}><Mail size={15}/> Compose email</Link>}
                    {contact.phone && <a href={`tel:${contact.phone}`}><Phone size={15}/> Call contact</a>}
                    <Link className="sw-contact-primary" href={`/hub/contacts/${contact.id}`}>View contact record <ArrowRight size={15}/></Link>
                  </div>
                </div>
              </details>
            );
          })}
        </section>
      )}
      </div>
    </WorkspacePage>
  );
}
