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
    <div className="hub-page hub-contacts-v2-page">
      <header className="hub-contacts-v2-head">
        <div>
          <span className="hub-contacts-v2-kicker">PEOPLE / CRM</span>
          <h1>Contacts</h1>
          <p>Track everyone who has reached Staark Inc. and see where each relationship is going.</p>
        </div>
        <div className="hub-contacts-v2-head-count">
          <UsersRound size={15} /><strong>{contacts.length}</strong><span>contacts</span>
        </div>
      </header>

      <section className="hub-contacts-v2-stats" aria-label="Contact overview">
        <div className="hub-contacts-v2-stat">
          <span className="hub-contacts-v2-stat-icon"><UserRound size={16} /></span>
          <div><small>Total contacts</small><strong>{contacts.length}</strong><span>Known people</span></div>
        </div>
        <div className="hub-contacts-v2-stat">
          <span className="hub-contacts-v2-stat-icon hub-contacts-v2-stat-icon-lead"><Target size={16} /></span>
          <div><small>With leads</small><strong>{contactsWithLeads}</strong><span>Commercial interest</span></div>
        </div>
        <div className="hub-contacts-v2-stat">
          <span className="hub-contacts-v2-stat-icon hub-contacts-v2-stat-icon-client"><Building2 size={16} /></span>
          <div><small>Linked clients</small><strong>{contactsWithClients}</strong><span>Converted relationships</span></div>
        </div>
        <div className="hub-contacts-v2-stat">
          <span className="hub-contacts-v2-stat-icon"><MessageSquareText size={16} /></span>
          <div><small>Messages</small><strong>{totalMessages}</strong><span>Linked conversations</span></div>
        </div>
      </section>

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

        <nav className="hub-contacts-v2-filters" aria-label="Contact status">
          <Link href={getFilterHref("all", q)} className={filter === "all" ? "hub-contacts-v2-filter-active" : undefined}>All<strong>{contacts.length}</strong></Link>
          <Link href={getFilterHref("leads", q)} className={filter === "leads" ? "hub-contacts-v2-filter-active" : undefined}>Leads<strong>{contactsWithLeads}</strong></Link>
          <Link href={getFilterHref("clients", q)} className={filter === "clients" ? "hub-contacts-v2-filter-active" : undefined}>Clients<strong>{contactsWithClients}</strong></Link>
          <Link href={getFilterHref("unlinked", q)} className={filter === "unlinked" ? "hub-contacts-v2-filter-active" : undefined}>Unlinked</Link>
        </nav>
      </section>

      {filteredContacts.length === 0 ? (
        <div className="hub-contacts-v2-empty">
          <UserRound size={26} />
          <h2>{contacts.length === 0 ? "No contacts yet" : "No matches"}</h2>
          <p>{contacts.length === 0 ? "New contacts will appear here after the first enquiry or conversation." : "Try another search term or switch the current filter."}</p>
          {contacts.length > 0 ? <Link href="/hub/contacts" className="hub-secondary-button">Clear filters</Link> : null}
        </div>
      ) : (
        <section className="hub-contacts-v2-list" aria-label="Contacts">
          {filteredContacts.map((contact) => {
            const fallback = contact.email || contact.phone || contact.facebook || contact.company;
            return (
              <article key={contact.id} className="hub-contacts-v2-row">
                <div className="hub-contacts-v2-main">
                  <div className="hub-contacts-v2-avatar">{getInitials(contact.name, fallback)}</div>
                  <div className="hub-contacts-v2-identity">
                    <Link href={`/hub/contacts/${contact.id}`}>{contact.name || contact.company || "Unknown contact"}</Link>
                    {contact.email ? <span><Mail size={12} />{contact.email}</span> : null}
                    {contact.phone ? <span><Phone size={12} />{contact.phone}</span> : null}
                    {contact.facebook ? <span><Globe2 size={12} />Facebook</span> : null}
                    {contact.company ? <span><Building2 size={12} />{contact.company}</span> : null}
                  </div>
                </div>

                <div className="hub-contacts-v2-signals">
                  <span className={contact._count.leads ? "hub-contacts-v2-signal-lead" : undefined}>
                    <Target size={12} />{contact._count.leads} lead{contact._count.leads === 1 ? "" : "s"}
                  </span>
                  <span className={contact._count.clients ? "hub-contacts-v2-signal-client" : undefined}>
                    <Building2 size={12} />
                    {contact._count.clients ? `${contact._count.clients} client${contact._count.clients === 1 ? "" : "s"}` : "Not a client"}
                  </span>
                  <span><MessageSquareText size={12} />{contact._count.messages} message{contact._count.messages === 1 ? "" : "s"}</span>
                </div>

                <div className="hub-contacts-v2-tail">
                  <time dateTime={contact.createdAt.toISOString()}>Added {formatDate(contact.createdAt)}</time>
                  <Link href={`/hub/contacts/${contact.id}`}>Open<ArrowRight size={13} /></Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
