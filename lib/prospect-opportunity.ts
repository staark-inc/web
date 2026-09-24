import type { ProspectStatus } from "@/generated/prisma/client";

export type OpportunityCandidate = {
  id: string;
  name: string;
  city: string | null;
  category: string | null;
  status: ProspectStatus;
  leadScore: number;
  importedLeadId: string | null;
  website: string | null;
  websiteScore: number | null;
  email: string | null;
  googlePhone: string | null;
  websitePhone: string | null;
  contactForm: boolean;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  rating: number | null;
  reviews: number | null;
  https: boolean | null;
  mobile: boolean | null;
  copyrightYear: number | null;
  loadSeconds: number | null;
  httpStatus: number | null;
};

export type OpportunityReadiness = "HOT" | "STRONG" | "REVIEW" | "LOW";

export type RankedOpportunity = OpportunityCandidate & {
  phone: string | null;
  score: number;
  readiness: OpportunityReadiness;
  hasDirectContact: boolean;
  hasAnyContact: boolean;
  suggestedOffer: "Standard Website" | "Website + SEO";
  reasons: string[];
  breakdown: {
    websiteNeed: number;
    contactability: number;
    businessProof: number;
    technicalNeed: number;
    scannerSignal: number;
  };
};

function websiteNeed(candidate: OpportunityCandidate) {
  if (!candidate.website) {
    return { points: 40, reason: "No website" };
  }

  if (candidate.status === "BROKEN_WEBSITE" || (candidate.httpStatus ?? 0) >= 400) {
    return {
      points: 38,
      reason: candidate.httpStatus && candidate.httpStatus >= 400
        ? `Website error HTTP ${candidate.httpStatus}`
        : "Broken website",
    };
  }

  if (candidate.status === "OLD_WEBSITE") {
    return { points: 30, reason: "Old website" };
  }

  if (candidate.status === "WEAK_WEBSITE") {
    return { points: 22, reason: "Weak website" };
  }

  // Once a prospect is imported its status becomes IMPORTED, so reconstruct
  // the original website opportunity from the scanner fields when possible.
  if (candidate.status === "IMPORTED") {
    if ((candidate.websiteScore ?? 0) >= 50) {
      return { points: 30, reason: "Old website" };
    }
    if ((candidate.websiteScore ?? 0) >= 20) {
      return { points: 22, reason: "Weak website" };
    }
  }

  return { points: 0, reason: "" };
}

export function rankOpportunity(candidate: OpportunityCandidate): RankedOpportunity | null {
  if (candidate.status === "IGNORED") return null;

  const phone = candidate.googlePhone || candidate.websitePhone;
  const need = websiteNeed(candidate);

  // The workspace is deliberately for actual website opportunities, not every
  // company in the prospect database.
  if (need.points === 0) return null;

  const reasons: string[] = [need.reason];

  let contactability = 0;
  if (candidate.email) {
    contactability += 10;
    reasons.push("Email available");
  }
  if (phone) {
    contactability += 10;
    reasons.push("Phone available");
  }
  if (candidate.contactForm) contactability += 3;
  if (candidate.instagram || candidate.facebook || candidate.linkedin) contactability += 2;
  contactability = Math.min(contactability, 25);

  let businessProof = 0;
  if ((candidate.rating ?? 0) >= 4.5) businessProof += 8;
  else if ((candidate.rating ?? 0) >= 4) businessProof += 6;
  else if ((candidate.rating ?? 0) >= 3.5) businessProof += 3;

  if ((candidate.reviews ?? 0) >= 150) businessProof += 12;
  else if ((candidate.reviews ?? 0) >= 50) businessProof += 9;
  else if ((candidate.reviews ?? 0) >= 10) businessProof += 5;
  else if ((candidate.reviews ?? 0) > 0) businessProof += 2;
  businessProof = Math.min(businessProof, 20);

  if (candidate.rating != null && (candidate.reviews ?? 0) > 0) {
    reasons.push(`${candidate.rating.toFixed(1)}★ · ${candidate.reviews} reviews`);
  }

  // Technical checks only make sense when a website actually exists. A
  // missing website already receives the maximum website-need score above;
  // treating scanner defaults such as mobile=false / https=false as extra
  // faults would double-count the same opportunity.
  let technicalNeed = 0;
  if (candidate.website) {
    if (candidate.mobile === false) {
      technicalNeed += 4;
      reasons.push("Not mobile friendly");
    }
    if (candidate.https === false) {
      technicalNeed += 3;
      reasons.push("No HTTPS");
    }

    const staleYear = new Date().getFullYear() - 3;
    if (candidate.copyrightYear != null && candidate.copyrightYear <= staleYear) {
      technicalNeed += 2;
      reasons.push(`Copyright ${candidate.copyrightYear}`);
    }
    if ((candidate.loadSeconds ?? 0) >= 4) {
      technicalNeed += 1;
      reasons.push(`Slow load ${candidate.loadSeconds?.toFixed(1)}s`);
    }
  }
  technicalNeed = Math.min(technicalNeed, 10);

  const scannerSignal = Math.min(5, Math.round(Math.max(0, candidate.leadScore) / 20));

  const score = Math.min(
    100,
    need.points + contactability + businessProof + technicalNeed + scannerSignal,
  );

  const hasDirectContact = Boolean(candidate.email || phone);
  const hasAnyContact = Boolean(
    candidate.email ||
    phone ||
    candidate.contactForm ||
    candidate.instagram ||
    candidate.facebook ||
    candidate.linkedin,
  );

  const readiness: OpportunityReadiness =
    score >= 75 && hasDirectContact
      ? "HOT"
      : score >= 60 && hasAnyContact
        ? "STRONG"
        : score >= 45
          ? "REVIEW"
          : "LOW";

  const suggestedOffer: RankedOpportunity["suggestedOffer"] =
    businessProof >= 12 && need.points >= 30 ? "Website + SEO" : "Standard Website";

  return {
    ...candidate,
    phone,
    score,
    readiness,
    hasDirectContact,
    hasAnyContact,
    suggestedOffer,
    reasons: Array.from(new Set(reasons)).slice(0, 6),
    breakdown: {
      websiteNeed: need.points,
      contactability,
      businessProof,
      technicalNeed,
      scannerSignal,
    },
  };
}

export function readinessLabel(value: OpportunityReadiness) {
  switch (value) {
    case "HOT":
      return "Offer-ready";
    case "STRONG":
      return "Contact next";
    case "REVIEW":
      return "Worth review";
    default:
      return "Low priority";
  }
}
