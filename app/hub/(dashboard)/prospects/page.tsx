import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Target,
  UserPlus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import type { Prisma, ProspectStatus } from "@/generated/prisma/client";
import ProspectImportButton from "./ProspectImportButton";
import {
  addProspectToLeads,
  ignoreProspect,
  restoreProspect,
} from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    city?: string;
    category?: string;
    page?: string;
  }>;
};

const statusLabels: Record<ProspectStatus, string> = {
  NO_WEBSITE: "No website",
  BROKEN_WEBSITE: "Broken website",
  OLD_WEBSITE: "Old website",
  WEAK_WEBSITE: "Weak website",
  GOOD_WEBSITE: "Good website",
  IGNORED: "Ignored",
  IMPORTED: "Added to Leads",
};

const allowedStatuses = new Set<ProspectStatus>([
  "NO_WEBSITE",
  "BROKEN_WEBSITE",
  "OLD_WEBSITE",
  "WEAK_WEBSITE",
  "GOOD_WEBSITE",
  "IGNORED",
  "IMPORTED",
]);

function reasonList(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function bestContact(prospect: {
  email: string | null;
  contactForm: boolean;
  googlePhone: string | null;
  websitePhone: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
}) {
  if (prospect.email) return { label: prospect.email, kind: "email" as const };
  if (prospect.contactForm) return { label: "Contact form", kind: "form" as const };
  if (prospect.googlePhone || prospect.websitePhone) {
    return {
      label: prospect.googlePhone || prospect.websitePhone || "Phone",
      kind: "phone" as const,
    };
  }
  if (prospect.instagram) return { label: "Instagram", kind: "social" as const };
  if (prospect.facebook) return { label: "Facebook", kind: "social" as const };
  if (prospect.linkedin) return { label: "LinkedIn", kind: "social" as const };
  return { label: "Manual research", kind: "none" as const };
}

function paginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push("ellipsis");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < totalPages - 1) items.push("ellipsis");

  items.push(totalPages);
  return items;
}

export default async function ProspectsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const city = params.city?.trim() || "";
  const category = params.category?.trim() || "";
  const requestedStatus = params.status?.toUpperCase() as ProspectStatus | undefined;
  const status = requestedStatus && allowedStatuses.has(requestedStatus) ? requestedStatus : undefined;
  const parsedPage = Number.parseInt(params.page || "1", 10);
  const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const where: Prisma.ProspectWhereInput = {
    ...(status ? { status } : {}),
    ...(city ? { city } : {}),
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { website: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [
    filteredCount,
    totalCount,
    noWebsiteCount,
    weakCount,
    contactableCount,
    importedCount,
    cities,
    categories,
  ] = await Promise.all([
    prisma.prospect.count({ where }),
    prisma.prospect.count(),
    prisma.prospect.count({ where: { status: "NO_WEBSITE" } }),
    prisma.prospect.count({
      where: { status: { in: ["BROKEN_WEBSITE", "OLD_WEBSITE", "WEAK_WEBSITE"] } },
    }),
    prisma.prospect.count({
      where: {
        OR: [
          { email: { not: null } },
          { googlePhone: { not: null } },
          { websitePhone: { not: null } },
          { contactForm: true },
        ],
      },
    }),
    prisma.prospect.count({ where: { status: "IMPORTED" } }),
    prisma.prospect.findMany({
      where: { city: { not: null } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
    prisma.prospect.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const prospects = await prisma.prospect.findMany({
    where,
    orderBy: [{ leadScore: "desc" }, { reviews: "desc" }, { createdAt: "desc" }],
    skip: offset,
    take: PAGE_SIZE,
  });

  function pageHref(page: number) {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (status) search.set("status", status);
    if (city) search.set("city", city);
    if (category) search.set("category", category);
    if (page > 1) search.set("page", String(page));

    const query = search.toString();
    return query ? `/hub/prospects?${query}` : "/hub/prospects";
  }

  const firstShown = filteredCount === 0 ? 0 : offset + 1;
  const lastShown = Math.min(offset + prospects.length, filteredCount);
  const pages = paginationItems(currentPage, totalPages);

  return (
    <div className="hub-page hub-prospects-page">
      <header className="hub-prospects-head">
        <div>
          <span className="hub-prospects-kicker">SALES / DISCOVERY</span>
          <h1>Prospects</h1>
          <p>
            Local businesses discovered outside the CRM. Review the opportunity first,
            then promote only the good ones into Leads.
          </p>
        </div>

        <div className="hub-prospects-head-actions">
          <div className="hub-prospects-head-badge">
            <Sparkles size={16} />
            <span>{totalCount} discovered</span>
          </div>
          <ProspectImportButton />
        </div>
      </header>

      <section className="hub-prospects-stats" aria-label="Prospect overview">
        <div className="hub-prospects-stat">
          <Globe2 size={17} />
          <div><small>No website</small><strong>{noWebsiteCount}</strong></div>
        </div>
        <div className="hub-prospects-stat">
          <Target size={17} />
          <div><small>Weak / old</small><strong>{weakCount}</strong></div>
        </div>
        <div className="hub-prospects-stat">
          <Mail size={17} />
          <div><small>Contactable</small><strong>{contactableCount}</strong></div>
        </div>
        <div className="hub-prospects-stat">
          <CheckCircle2 size={17} />
          <div><small>Added to Leads</small><strong>{importedCount}</strong></div>
        </div>
      </section>

      <form className="hub-prospects-toolbar" action="/hub/prospects" method="get">
        <label className="hub-prospects-search">
          <Search size={16} />
          <input name="q" defaultValue={q} placeholder="Search company, email, website..." />
        </label>

        <select name="status" defaultValue={status || ""} aria-label="Filter by status">
          <option value="">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select name="city" defaultValue={city} aria-label="Filter by city">
          <option value="">All cities</option>
          {cities.map((item) => item.city && (
            <option key={item.city} value={item.city}>{item.city}</option>
          ))}
        </select>

        <select name="category" defaultValue={category} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((item) => item.category && (
            <option key={item.category} value={item.category}>{item.category}</option>
          ))}
        </select>

        <button type="submit">Filter</button>
        {(q || status || city || category) && (
          <Link href="/hub/prospects" className="hub-prospects-clear">Clear</Link>
        )}
      </form>

      <div className="hub-prospects-result-bar">
        <span>
          {filteredCount === 0
            ? "0 prospects"
            : `Showing ${firstShown}–${lastShown} of ${filteredCount}`}
        </span>
        {totalPages > 1 && <small>Page {currentPage} of {totalPages}</small>}
      </div>

      {prospects.length === 0 ? (
        <div className="hub-empty-state">
          <Building2 size={28} />
          <h2>No prospects yet</h2>
          <p>Import scanner results and they will appear here for qualification.</p>
        </div>
      ) : (
        <section className="hub-prospects-list" aria-label="Prospect list">
          <div className="hub-prospects-table-head" aria-hidden="true">
            <span>Company</span>
            <span>Website</span>
            <span>Contact</span>
            <span>Opportunity</span>
            <span>Location</span>
            <span />
          </div>

          {prospects.map((prospect) => {
            const contact = bestContact(prospect);
            const reasons = reasonList(prospect.reasons);
            const phone = prospect.googlePhone || prospect.websitePhone;

            return (
              <details key={prospect.id} className="hub-prospect-row">
                <summary>
                  <div className="hub-prospect-company">
                    <div className="hub-prospect-logo">
                      {prospect.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <strong>{prospect.name}</strong>
                      <span>{prospect.category || "Local business"}</span>
                    </div>
                  </div>

                  <div className="hub-prospect-website">
                    {prospect.website ? (
                      <a href={prospect.website} target="_blank" rel="noreferrer">
                        {prospect.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        <ArrowUpRight size={12} />
                      </a>
                    ) : (
                      <span className="hub-prospect-no-website">No website</span>
                    )}
                    {prospect.websiteScore != null && (
                      <small>Site score {prospect.websiteScore}/100</small>
                    )}
                  </div>

                  <div className="hub-prospect-contact">
                    {contact.kind === "email" && <Mail size={14} />}
                    {contact.kind === "phone" && <Phone size={14} />}
                    {contact.kind === "form" && <Globe2 size={14} />}
                    <span>{contact.label}</span>
                  </div>

                  <div className="hub-prospect-score-cell">
                    <span className={`hub-prospect-status hub-prospect-status-${prospect.status.toLowerCase().replaceAll("_", "-")}`}>
                      {statusLabels[prospect.status]}
                    </span>
                    <strong>{prospect.leadScore}</strong>
                  </div>

                  <div className="hub-prospect-location">
                    <MapPin size={13} />
                    <span>{prospect.city || "—"}</span>
                    {prospect.rating != null && <small>★ {prospect.rating.toFixed(1)} · {prospect.reviews || 0}</small>}
                  </div>

                  <span className="hub-prospect-open">Open</span>
                </summary>

                <div className="hub-prospect-detail">
                  <div className="hub-prospect-detail-main">
                    <div className="hub-prospect-detail-block">
                      <small>WHY THIS PROSPECT?</small>
                      {reasons.length ? (
                        <ul>{reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                      ) : (
                        <p>No scanner warnings recorded.</p>
                      )}
                    </div>

                    <div className="hub-prospect-detail-block">
                      <small>CONTACT</small>
                      <div className="hub-prospect-links">
                        {prospect.email && <a href={`mailto:${prospect.email}`}><Mail size={14} />{prospect.email}</a>}
                        {phone && <a href={`tel:${phone}`}><Phone size={14} />{phone}</a>}
                        {prospect.contactPage && <a href={prospect.contactPage} target="_blank" rel="noreferrer"><Globe2 size={14} />Contact page</a>}
                        {prospect.instagram && <a href={prospect.instagram} target="_blank" rel="noreferrer">Instagram</a>}
                        {prospect.facebook && <a href={prospect.facebook} target="_blank" rel="noreferrer">Facebook</a>}
                        {prospect.linkedin && <a href={prospect.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
                      </div>
                    </div>

                    <div className="hub-prospect-detail-block">
                      <small>WEBSITE CHECK</small>
                      <div className="hub-prospect-tech-grid">
                        <span>HTTPS <strong>{prospect.https == null ? "—" : prospect.https ? "Yes" : "No"}</strong></span>
                        <span>Mobile <strong>{prospect.mobile == null ? "—" : prospect.mobile ? "Yes" : "No"}</strong></span>
                        <span>HTTP <strong>{prospect.httpStatus ?? "—"}</strong></span>
                        <span>Copyright <strong>{prospect.copyrightYear ?? "—"}</strong></span>
                      </div>
                    </div>
                  </div>

                  <aside className="hub-prospect-detail-side">
                    {prospect.address && <p>{prospect.address}</p>}
                    {prospect.googleMapsUrl && (
                      <a href={prospect.googleMapsUrl} target="_blank" rel="noreferrer" className="hub-prospect-map-link">
                        View on Google Maps <ArrowUpRight size={13} />
                      </a>
                    )}

                    <div className="hub-prospect-actions">
                      {prospect.status === "IMPORTED" && prospect.importedLeadId ? (
                        <Link href={`/hub/leads/${prospect.importedLeadId}`} className="hub-prospect-primary-action">
                          Open Lead <ArrowUpRight size={14} />
                        </Link>
                      ) : prospect.email && prospect.status !== "IGNORED" ? (
                        <form action={addProspectToLeads}>
                          <input type="hidden" name="prospectId" value={prospect.id} />
                          <button type="submit" className="hub-prospect-primary-action">
                            <UserPlus size={14} /> Add to Leads
                          </button>
                        </form>
                      ) : !prospect.email && prospect.status !== "IGNORED" ? (
                        <span className="hub-prospect-action-note">Add an email before promoting to Leads.</span>
                      ) : null}

                      {prospect.status === "IGNORED" ? (
                        <form action={restoreProspect}>
                          <input type="hidden" name="prospectId" value={prospect.id} />
                          <button type="submit" className="hub-prospect-secondary-action">Restore</button>
                        </form>
                      ) : prospect.status !== "IMPORTED" ? (
                        <form action={ignoreProspect}>
                          <input type="hidden" name="prospectId" value={prospect.id} />
                          <button type="submit" className="hub-prospect-secondary-action">Ignore</button>
                        </form>
                      ) : null}
                    </div>
                  </aside>
                </div>
              </details>
            );
          })}
        </section>
      )}

      {totalPages > 1 && (
        <nav className="hub-prospects-pagination" aria-label="Prospects pages">
          <Link
            href={pageHref(Math.max(1, currentPage - 1))}
            className={`hub-prospects-page-button hub-prospects-page-nav${currentPage === 1 ? " is-disabled" : ""}`}
            aria-disabled={currentPage === 1}
            tabIndex={currentPage === 1 ? -1 : undefined}
          >
            <ChevronLeft size={15} />
            Previous
          </Link>

          <div className="hub-prospects-page-numbers">
            {pages.map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="hub-prospects-page-ellipsis">…</span>
              ) : (
                <Link
                  key={item}
                  href={pageHref(item)}
                  className={`hub-prospects-page-button${item === currentPage ? " is-active" : ""}`}
                  aria-current={item === currentPage ? "page" : undefined}
                >
                  {item}
                </Link>
              ),
            )}
          </div>

          <Link
            href={pageHref(Math.min(totalPages, currentPage + 1))}
            className={`hub-prospects-page-button hub-prospects-page-nav${currentPage === totalPages ? " is-disabled" : ""}`}
            aria-disabled={currentPage === totalPages}
            tabIndex={currentPage === totalPages ? -1 : undefined}
          >
            Next
            <ChevronRight size={15} />
          </Link>
        </nav>
      )}
    </div>
  );
}
