import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Target,
  UserPlus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { WorkspacePage, PageHeader, Metrics, Metric, InfoChip, ExpandableCard } from "@/components/hub/workspace";
import {
  rankOpportunity,
  readinessLabel,
  type OpportunityReadiness,
} from "@/lib/prospect-opportunity";
import { addProspectToLeads } from "../prospects/actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type SearchParams = {
  q?: string;
  city?: string;
  category?: string;
  readiness?: string;
  contact?: string;
  pipeline?: string;
  page?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

function one(value: string | undefined, max = 120) {
  return (value || "").trim().slice(0, max);
}

function pageNumber(value: string | undefined) {
  const parsed = Number.parseInt(value || "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(filters: SearchParams, page: number) {
  const params = new URLSearchParams();
  for (const key of ["q", "city", "category", "readiness", "contact", "pipeline"] as const) {
    const value = one(filters[key]);
    if (value && value !== "all") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/hub/opportunities${query ? `?${query}` : ""}`;
}

function contactChannels(opportunity: {
  email: string | null;
  phone: string | null;
  facebook: string | null;
}) {
  return [
    opportunity.email ? { value: "EMAIL", label: "Email" } : null,
    opportunity.phone ? { value: "WHATSAPP", label: "WhatsApp" } : null,
    opportunity.facebook ? { value: "FACEBOOK", label: "Facebook" } : null,
  ].filter((item): item is { value: "EMAIL" | "WHATSAPP" | "FACEBOOK"; label: string } => Boolean(item));
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const q = one(raw.q).toLowerCase();
  const city = one(raw.city);
  const category = one(raw.category);
  const readiness = one(raw.readiness) as OpportunityReadiness | "" | "all";
  const contact = one(raw.contact);
  const pipeline = one(raw.pipeline);

  const candidates = await prisma.prospect.findMany({
    where: { status: { not: "IGNORED" } },
    select: {
      id: true,
      name: true,
      city: true,
      category: true,
      status: true,
      leadScore: true,
      importedLeadId: true,
      website: true,
      websiteScore: true,
      email: true,
      googlePhone: true,
      websitePhone: true,
      contactForm: true,
      instagram: true,
      facebook: true,
      linkedin: true,
      rating: true,
      reviews: true,
      https: true,
      mobile: true,
      copyrightYear: true,
      loadSeconds: true,
      httpStatus: true,
    },
  });

  const all = candidates
    .map(rankOpportunity)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) =>
      b.score - a.score ||
      (b.reviews ?? 0) - (a.reviews ?? 0) ||
      a.name.localeCompare(b.name),
    );

  const cities = Array.from(new Set(all.map((item) => item.city).filter(Boolean) as string[])).sort();
  const categories = Array.from(new Set(all.map((item) => item.category).filter(Boolean) as string[])).sort();

  const filtered = all.filter((item) => {
    if (q) {
      const haystack = [item.name, item.city, item.category, item.email, item.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (city && city !== "all" && item.city !== city) return false;
    if (category && category !== "all" && item.category !== category) return false;
    if (readiness && readiness !== "all" && item.readiness !== readiness) return false;

    if (contact === "direct" && !item.hasDirectContact) return false;
    if (contact === "email" && !item.email) return false;
    if (contact === "phone" && !item.phone) return false;

    if (pipeline === "new" && item.importedLeadId) return false;
    if (pipeline === "lead" && !item.importedLeadId) return false;

    return true;
  });

  const hotCount = all.filter((item) => item.readiness === "HOT").length;
  const directCount = all.filter((item) => item.hasDirectContact).length;
  const inLeadsCount = all.filter((item) => item.importedLeadId).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(pageNumber(raw.page), totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const shown = filtered.slice(offset, offset + PAGE_SIZE);

  return (
    <WorkspacePage>
      <div className="sw-sales-page sw-opportunities-page">
        <PageHeader eyebrow="SALES / PRIORITY" title="Opportunities"
          description="Prioritized local companies, ranked by website need, contactability and business signals."
          action={<Link href="/hub/prospects" className="sw-overview-secondary"><Search size={15}/> Browse prospects</Link>}
        />
        <Metrics label="Opportunity overview">
          <Metric label="Opportunities" value={all.length} description="Ranked businesses" icon={<Sparkles size={18}/>} />
          <Metric label="Offer-ready" value={hotCount} description="Highest sales readiness" icon={<Target size={18}/>} />
          <Metric label="Direct contact" value={directCount} description="Reachable companies" icon={<Phone size={18}/>} />
          <Metric label="Already in Leads" value={inLeadsCount} description="Added to pipeline" icon={<CheckCircle2 size={18}/>} />
        </Metrics>
        <div className="sw-sales-guide">
          <span className="sw-eyebrow">PRIORITIZATION</span>
          <strong>Rank <span>→</span> Review <span>→</span> Contact <span>→</span> Convert</strong>
          <p>Open a company to see its score breakdown and suggested offer before promoting it into Leads.</p>
        </div>
      <form className="hub-opportunities-filters sw-opportunities-filters" method="get">
        <label className="hub-opportunities-search">
          <Search size={15} />
          <input name="q" defaultValue={raw.q || ""} placeholder="Search company, city, email, phone…" />
        </label>

        <select name="readiness" defaultValue={raw.readiness || "all"} aria-label="Priority">
          <option value="all">All priorities</option>
          <option value="HOT">Offer-ready</option>
          <option value="STRONG">Contact next</option>
          <option value="REVIEW">Worth review</option>
          <option value="LOW">Low priority</option>
        </select>

        <select name="city" defaultValue={raw.city || "all"} aria-label="City">
          <option value="all">All cities</option>
          {cities.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>

        <select name="category" defaultValue={raw.category || "all"} aria-label="Category">
          <option value="all">All categories</option>
          {categories.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>

        <select name="contact" defaultValue={raw.contact || "all"} aria-label="Contactability">
          <option value="all">Any contact</option>
          <option value="direct">Direct contact</option>
          <option value="email">Has email</option>
          <option value="phone">Has phone</option>
        </select>

        <select name="pipeline" defaultValue={raw.pipeline || "all"} aria-label="Pipeline">
          <option value="all">All pipeline states</option>
          <option value="new">Not in Leads</option>
          <option value="lead">Already in Leads</option>
        </select>

        <button type="submit" className="hub-primary-button">Filter</button>
        <Link href="/hub/opportunities" className="hub-secondary-button">Reset</Link>
      </form>

      <div className="hub-opportunities-result-bar">
        <span>
          {filtered.length === 0
            ? "0 opportunities"
            : `Showing ${offset + 1}–${Math.min(offset + shown.length, filtered.length)} of ${filtered.length}`}
        </span>
        <small>Highest score first</small>
      </div>

      {shown.length === 0 ? (
        <div className="hub-empty-state">
          <Building2 size={28} />
          <h2>No opportunities match these filters</h2>
          <p>Reset the filters or return to Prospects to review the full discovery database.</p>
        </div>
      ) : (
        <section className="hub-opportunities-list sw-opportunities-list">
          {shown.map((opportunity, index) => {
            const channels = contactChannels(opportunity);
            const rank = offset + index + 1;

            return (
              <ExpandableCard key={opportunity.id} className="sw-opportunity-card">
                <summary className="sw-opportunity-summary">
                  <span className="sw-opportunity-position">#{rank}</span>
                  <span className="sw-opportunity-identity">
                    <strong>{opportunity.name}</strong>
                    <small>{[opportunity.city, opportunity.category].filter(Boolean).join(" · ") || "Local business"}</small>
                  </span>
                  <span className="sw-opportunity-score">
                    <strong>{opportunity.score}</strong><small>Priority score</small>
                  </span>
                  <InfoChip tone={opportunity.readiness === "HOT" ? "success" : opportunity.readiness === "STRONG" ? "info" : "neutral"}>
                    {readinessLabel(opportunity.readiness)}
                  </InfoChip>
                  <span className="sw-opportunity-expand">Review <ChevronRight size={16}/></span>
                </summary>
                <div className="sw-opportunity-expanded">
                  <div className="sw-opportunity-analysis">
                    <span className="sw-eyebrow">WHY THIS OPPORTUNITY</span>
                    <div className="sw-opportunity-reason-list">
                      {opportunity.reasons.map(reason => <span key={reason}><CheckCircle2 size={14}/>{reason}</span>)}
                    </div>
                    <span className="sw-eyebrow">SCORE BREAKDOWN</span>
                    <div className="sw-opportunity-breakdown">
                      {([
                        ["Website need", opportunity.breakdown.websiteNeed, 40],
                        ["Contactability", opportunity.breakdown.contactability, 25],
                        ["Business proof", opportunity.breakdown.businessProof, 20],
                        ["Technical need", opportunity.breakdown.technicalNeed, 10],
                        ["Scanner", opportunity.breakdown.scannerSignal, 5],
                      ] as const).map(([label, score, maximum]) => (
                        <div key={label} className="sw-opportunity-score-row">
                          <div><span>{label}</span><strong>{score}/{maximum}</strong></div>
                          <progress max={maximum} value={score} aria-label={label + " score"}/>
                        </div>
                      ))}
                    </div>
                  </div>
                  <aside className="sw-opportunity-next-step">
                    <span className="sw-eyebrow">SUGGESTED OFFER</span>
                    <strong className="sw-opportunity-offer"><FileText size={17}/>{opportunity.suggestedOffer}</strong>
                    <div className="sw-opportunity-contact-actions">
                      {opportunity.email && <a href={`mailto:${opportunity.email}`}><Mail size={14}/> Email</a>}
                      {opportunity.phone && <a href={`tel:${opportunity.phone}`}><Phone size={14}/> Call</a>}
                      {opportunity.website && <a href={opportunity.website} target="_blank" rel="noreferrer">Website <ArrowUpRight size={14}/></a>}
                    </div>
                    {opportunity.importedLeadId ? (
                      <Link href={`/hub/leads/${opportunity.importedLeadId}`} className="sw-opportunity-main-action">Open lead <ArrowUpRight size={15}/></Link>
                    ) : channels.length > 0 ? (
                      <form action={addProspectToLeads} className="sw-opportunity-convert">
                        <input type="hidden" name="prospectId" value={opportunity.id}/>
                        <label htmlFor={`contact-channel-${opportunity.id}`}>Contact channel</label>
                        <select id={`contact-channel-${opportunity.id}`} name="contactChannel" defaultValue={channels[0].value}>
                          {channels.map(channel => <option key={channel.value} value={channel.value}>{channel.label}</option>)}
                        </select>
                        <button type="submit" className="sw-opportunity-main-action"><UserPlus size={15}/> Add to Leads</button>
                      </form>
                    ) : <p className="sw-opportunity-no-contact">Needs contact research before conversion.</p>}
                    <Link className="sw-opportunity-review-link" href={`/hub/prospects?q=${encodeURIComponent(opportunity.name)}`}>Review prospect <ArrowUpRight size={14}/></Link>
                  </aside>
                </div>
              </ExpandableCard>
            );
          })}
        </section>
      )}

      {totalPages > 1 && (
        <nav className="hub-opportunities-pagination" aria-label="Opportunity pages">
          <Link
            href={pageHref(raw, Math.max(1, currentPage - 1))}
            className={`hub-secondary-button${currentPage === 1 ? " is-disabled" : ""}`}
            aria-disabled={currentPage === 1}
          >
            <ChevronLeft size={14} /> Previous
          </Link>
          <span>Page {currentPage} of {totalPages}</span>
          <Link
            href={pageHref(raw, Math.min(totalPages, currentPage + 1))}
            className={`hub-secondary-button${currentPage === totalPages ? " is-disabled" : ""}`}
            aria-disabled={currentPage === totalPages}
          >
            Next <ChevronRight size={14} />
          </Link>
        </nav>
      )}
      </div>
    </WorkspacePage>
  );
}
