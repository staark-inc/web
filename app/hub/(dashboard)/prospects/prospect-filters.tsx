import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import type { Prisma, ProspectStatus } from "@/generated/prisma/client";

export type ProspectFilterParams = {
  q?: string;
  status?: string;
  city?: string;
  category?: string;
  lead?: string;
  contact?: string;
  websiteScore?: string;
  rating?: string;
  reviews?: string;
  https?: string;
  mobile?: string;
  email?: string;
  phone?: string;
  page?: string;
};

export type NormalizedProspectFilters = {
  q: string;
  status: ProspectStatus | "";
  city: string;
  category: string;
  lead: string;
  contact: string;
  websiteScore: string;
  rating: string;
  reviews: string;
  https: string;
  mobile: string;
  email: string;
  phone: string;
  page: number;
};

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  NO_WEBSITE: "No website",
  BROKEN_WEBSITE: "Broken website",
  OLD_WEBSITE: "Old website",
  WEAK_WEBSITE: "Weak website",
  GOOD_WEBSITE: "Good website",
  IGNORED: "Ignored",
  IMPORTED: "Added to Leads",
};

const allowedStatuses = new Set<ProspectStatus>(Object.keys(PROSPECT_STATUS_LABELS) as ProspectStatus[]);
const allowedLead = new Set(["90", "75", "50", "lt50"]);
const allowedContact = new Set(["email", "phone", "form", "social", "none"]);
const allowedWebsiteScore = new Set(["bad", "weak", "good"]);
const allowedRating = new Set(["45", "40", "lt40", "none"]);
const allowedReviews = new Set(["0-10", "11-50", "51-150", "150+"]);
const allowedTriState = new Set(["yes", "no", "unknown"]);
const allowedYesNo = new Set(["yes", "no"]);

function choice(value: string | undefined, allowed: Set<string>) {
  const normalized = value?.trim() || "";
  return allowed.has(normalized) ? normalized : "";
}

export function normalizeProspectFilters(params: ProspectFilterParams): NormalizedProspectFilters {
  const requestedStatus = params.status?.toUpperCase() as ProspectStatus | undefined;
  const parsedPage = Number.parseInt(params.page || "1", 10);

  return {
    q: params.q?.trim() || "",
    status: requestedStatus && allowedStatuses.has(requestedStatus) ? requestedStatus : "",
    city: params.city?.trim() || "",
    category: params.category?.trim() || "",
    lead: choice(params.lead, allowedLead),
    contact: choice(params.contact, allowedContact),
    websiteScore: choice(params.websiteScore, allowedWebsiteScore),
    rating: choice(params.rating, allowedRating),
    reviews: choice(params.reviews, allowedReviews),
    https: choice(params.https, allowedTriState),
    mobile: choice(params.mobile, allowedTriState),
    email: choice(params.email, allowedYesNo),
    phone: choice(params.phone, allowedYesNo),
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  };
}

export function buildProspectWhere(filters: NormalizedProspectFilters): Prisma.ProspectWhereInput {
  const and: Prisma.ProspectWhereInput[] = [];

  if (filters.q) {
    and.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { email: { contains: filters.q, mode: "insensitive" } },
        { website: { contains: filters.q, mode: "insensitive" } },
        { address: { contains: filters.q, mode: "insensitive" } },
        { googlePhone: { contains: filters.q, mode: "insensitive" } },
        { websitePhone: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }

  if (filters.status) and.push({ status: filters.status });
  if (filters.city) and.push({ city: filters.city });
  if (filters.category) and.push({ category: filters.category });

  switch (filters.lead) {
    case "90":
      and.push({ leadScore: { gte: 90 } });
      break;
    case "75":
      and.push({ leadScore: { gte: 75, lte: 89 } });
      break;
    case "50":
      and.push({ leadScore: { gte: 50, lte: 74 } });
      break;
    case "lt50":
      and.push({ leadScore: { lt: 50 } });
      break;
  }

  switch (filters.contact) {
    case "email":
      and.push({ email: { not: null } });
      break;
    case "phone":
      and.push({ OR: [{ googlePhone: { not: null } }, { websitePhone: { not: null } }] });
      break;
    case "form":
      and.push({ contactForm: true });
      break;
    case "social":
      and.push({
        OR: [
          { instagram: { not: null } },
          { facebook: { not: null } },
          { linkedin: { not: null } },
        ],
      });
      break;
    case "none":
      and.push({
        email: null,
        googlePhone: null,
        websitePhone: null,
        contactForm: false,
        instagram: null,
        facebook: null,
        linkedin: null,
      });
      break;
  }

  switch (filters.websiteScore) {
    case "bad":
      and.push({ website: { not: null }, websiteScore: { gte: 50 } });
      break;
    case "weak":
      and.push({ website: { not: null }, websiteScore: { gte: 20, lte: 49 } });
      break;
    case "good":
      and.push({ website: { not: null }, websiteScore: { lt: 20 } });
      break;
  }

  switch (filters.rating) {
    case "45":
      and.push({ rating: { gte: 4.5 } });
      break;
    case "40":
      and.push({ rating: { gte: 4.0, lt: 4.5 } });
      break;
    case "lt40":
      and.push({ rating: { lt: 4.0 } });
      break;
    case "none":
      and.push({ rating: null });
      break;
  }

  switch (filters.reviews) {
    case "0-10":
      and.push({ reviews: { gte: 0, lte: 10 } });
      break;
    case "11-50":
      and.push({ reviews: { gte: 11, lte: 50 } });
      break;
    case "51-150":
      and.push({ reviews: { gte: 51, lte: 150 } });
      break;
    case "150+":
      and.push({ reviews: { gt: 150 } });
      break;
  }

  if (filters.https === "yes") and.push({ https: true });
  if (filters.https === "no") and.push({ https: false });
  if (filters.https === "unknown") and.push({ https: null });

  if (filters.mobile === "yes") and.push({ mobile: true });
  if (filters.mobile === "no") and.push({ mobile: false });
  if (filters.mobile === "unknown") and.push({ mobile: null });

  if (filters.email === "yes") and.push({ email: { not: null } });
  if (filters.email === "no") and.push({ email: null });

  if (filters.phone === "yes") {
    and.push({ OR: [{ googlePhone: { not: null } }, { websitePhone: { not: null } }] });
  }
  if (filters.phone === "no") {
    and.push({ googlePhone: null, websitePhone: null });
  }

  return and.length ? { AND: and } : {};
}

export function buildProspectPageHref(filters: NormalizedProspectFilters, page: number) {
  const search = new URLSearchParams();

  if (filters.q) search.set("q", filters.q);
  if (filters.status) search.set("status", filters.status);
  if (filters.city) search.set("city", filters.city);
  if (filters.category) search.set("category", filters.category);
  if (filters.lead) search.set("lead", filters.lead);
  if (filters.contact) search.set("contact", filters.contact);
  if (filters.websiteScore) search.set("websiteScore", filters.websiteScore);
  if (filters.rating) search.set("rating", filters.rating);
  if (filters.reviews) search.set("reviews", filters.reviews);
  if (filters.https) search.set("https", filters.https);
  if (filters.mobile) search.set("mobile", filters.mobile);
  if (filters.email) search.set("email", filters.email);
  if (filters.phone) search.set("phone", filters.phone);
  if (page > 1) search.set("page", String(page));

  const query = search.toString();
  return query ? `/hub/prospects?${query}` : "/hub/prospects";
}

export function hasActiveProspectFilters(filters: NormalizedProspectFilters) {
  return Boolean(
    filters.q ||
    filters.status ||
    filters.city ||
    filters.category ||
    filters.lead ||
    filters.contact ||
    filters.websiteScore ||
    filters.rating ||
    filters.reviews ||
    filters.https ||
    filters.mobile ||
    filters.email ||
    filters.phone
  );
}

function advancedFilterCount(filters: NormalizedProspectFilters) {
  return [
    filters.websiteScore,
    filters.rating,
    filters.reviews,
    filters.https,
    filters.mobile,
    filters.email,
    filters.phone,
  ].filter(Boolean).length;
}

type FilterBarProps = {
  filters: NormalizedProspectFilters;
  cities: Array<{ city: string | null }>;
  categories: Array<{ category: string | null }>;
};

export function ProspectFilterBar({ filters, cities, categories }: FilterBarProps) {
  const advancedCount = advancedFilterCount(filters);
  const active = hasActiveProspectFilters(filters);

  return (
    <form className="hub-prospects-toolbar" action="/hub/prospects" method="get">
      <label className="hub-prospects-search">
        <Search size={16} />
        <input name="q" defaultValue={filters.q} placeholder="Search company, email, phone..." />
      </label>

      <select name="status" defaultValue={filters.status} aria-label="Filter by status">
        <option value="">All statuses</option>
        {Object.entries(PROSPECT_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <select name="city" defaultValue={filters.city} aria-label="Filter by city">
        <option value="">All cities</option>
        {cities.map((item) => item.city && (
          <option key={item.city} value={item.city}>{item.city}</option>
        ))}
      </select>

      <select name="category" defaultValue={filters.category} aria-label="Filter by category">
        <option value="">All categories</option>
        {categories.map((item) => item.category && (
          <option key={item.category} value={item.category}>{item.category}</option>
        ))}
      </select>

      <select name="lead" defaultValue={filters.lead} aria-label="Filter by lead score">
        <option value="">Any lead score</option>
        <option value="90">90+ · Priority</option>
        <option value="75">75–89 · Strong</option>
        <option value="50">50–74 · Medium</option>
        <option value="lt50">Under 50</option>
      </select>

      <select name="contact" defaultValue={filters.contact} aria-label="Filter by contact method">
        <option value="">Any contact</option>
        <option value="email">Email</option>
        <option value="phone">Phone</option>
        <option value="form">Contact form</option>
        <option value="social">Social profile</option>
        <option value="none">No contact found</option>
      </select>

      <button type="submit">Filter</button>
      {active && <Link href="/hub/prospects" className="hub-prospects-clear">Clear</Link>}

      <details className="hub-prospects-more" open={advancedCount > 0}>
        <summary>
          <span><SlidersHorizontal size={15} /> More filters</span>
          {advancedCount > 0 && <strong>{advancedCount}</strong>}
          <ChevronDown className="hub-prospects-more-chevron" size={15} />
        </summary>

        <div className="hub-prospects-advanced-grid">
          <label>
            <span>Website score</span>
            <select name="websiteScore" defaultValue={filters.websiteScore}>
              <option value="">Any score</option>
              <option value="bad">50+ · Bad</option>
              <option value="weak">20–49 · Weak</option>
              <option value="good">Under 20 · Good</option>
            </select>
          </label>

          <label>
            <span>Google rating</span>
            <select name="rating" defaultValue={filters.rating}>
              <option value="">Any rating</option>
              <option value="45">4.5+</option>
              <option value="40">4.0–4.49</option>
              <option value="lt40">Under 4.0</option>
              <option value="none">No rating</option>
            </select>
          </label>

          <label>
            <span>Reviews</span>
            <select name="reviews" defaultValue={filters.reviews}>
              <option value="">Any reviews</option>
              <option value="0-10">0–10</option>
              <option value="11-50">11–50</option>
              <option value="51-150">51–150</option>
              <option value="150+">150+</option>
            </select>
          </label>

          <label>
            <span>HTTPS</span>
            <select name="https" defaultValue={filters.https}>
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>

          <label>
            <span>Mobile friendly</span>
            <select name="mobile" defaultValue={filters.mobile}>
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>

          <label>
            <span>Email found</span>
            <select name="email" defaultValue={filters.email}>
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <label>
            <span>Phone found</span>
            <select name="phone" defaultValue={filters.phone}>
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
      </details>
    </form>
  );
}
