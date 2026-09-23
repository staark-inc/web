import Link from "next/link";
import { ArrowUpRight, Mail, Phone, Sparkles } from "lucide-react";

import { prisma } from "@/lib/prisma";
import type { ProspectStatus } from "@/generated/prisma/client";

const opportunityPoints: Record<ProspectStatus, number> = {
  NO_WEBSITE: 40,
  BROKEN_WEBSITE: 36,
  OLD_WEBSITE: 30,
  WEAK_WEBSITE: 20,
  GOOD_WEBSITE: 0,
  IGNORED: 0,
  IMPORTED: 0,
};

const opportunityLabels: Partial<Record<ProspectStatus, string>> = {
  NO_WEBSITE: "No website",
  BROKEN_WEBSITE: "Broken website",
  OLD_WEBSITE: "Old website",
  WEAK_WEBSITE: "Weak website",
  GOOD_WEBSITE: "Good website",
};

type Candidate = {
  id: string;
  name: string;
  city: string | null;
  category: string | null;
  status: ProspectStatus;
  leadScore: number;
  email: string | null;
  googlePhone: string | null;
  websitePhone: string | null;
  contactForm: boolean;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  rating: number | null;
  reviews: number | null;
};

function rankProspect(prospect: Candidate) {
  let score = opportunityPoints[prospect.status] || 0;
  const reasons: string[] = [];
  const phone = prospect.googlePhone || prospect.websitePhone;

  const opportunity = opportunityLabels[prospect.status];
  if (opportunity && prospect.status !== "GOOD_WEBSITE") reasons.push(opportunity);

  let contactPoints = 0;
  if (prospect.email) {
    contactPoints += 14;
    reasons.push("Email");
  }
  if (phone) {
    contactPoints += 14;
    reasons.push("Phone");
  }
  if (prospect.contactForm) contactPoints += 6;
  if (prospect.instagram || prospect.facebook || prospect.linkedin) contactPoints += 4;
  score += Math.min(contactPoints, 30);

  let proofPoints = 0;
  if ((prospect.rating ?? 0) >= 4.5) proofPoints += 8;
  else if ((prospect.rating ?? 0) >= 4) proofPoints += 6;
  else if ((prospect.rating ?? 0) >= 3.5) proofPoints += 3;

  if ((prospect.reviews ?? 0) >= 150) proofPoints += 12;
  else if ((prospect.reviews ?? 0) >= 50) proofPoints += 9;
  else if ((prospect.reviews ?? 0) >= 10) proofPoints += 5;
  else if ((prospect.reviews ?? 0) > 0) proofPoints += 2;

  score += Math.min(proofPoints, 20);
  score += Math.round(Math.min(Math.max(prospect.leadScore, 0), 100) / 10);

  if (prospect.rating != null && (prospect.reviews ?? 0) > 0) {
    reasons.push(`${prospect.rating.toFixed(1)}★ · ${prospect.reviews}`);
  }

  return {
    ...prospect,
    phone,
    priorityScore: Math.min(score, 100),
    reasons: reasons.slice(0, 3),
  };
}

export default async function ProspectTop10() {
  const candidates = await prisma.prospect.findMany({
    where: {
      status: { notIn: ["IGNORED", "IMPORTED"] },
      OR: [
        { email: { not: null } },
        { googlePhone: { not: null } },
        { websitePhone: { not: null } },
        { contactForm: true },
        { instagram: { not: null } },
        { facebook: { not: null } },
        { linkedin: { not: null } },
      ],
    },
    select: {
      id: true,
      name: true,
      city: true,
      category: true,
      status: true,
      leadScore: true,
      email: true,
      googlePhone: true,
      websitePhone: true,
      contactForm: true,
      instagram: true,
      facebook: true,
      linkedin: true,
      rating: true,
      reviews: true,
    },
  });

  const top = candidates
    .map(rankProspect)
    .sort((a, b) =>
      b.priorityScore - a.priorityScore ||
      (b.reviews ?? 0) - (a.reviews ?? 0) ||
      a.name.localeCompare(b.name),
    )
    .slice(0, 10);

  if (!top.length) return null;

  return (
    <section className="hub-prospects-top10" aria-label="Top prospect opportunities">
      <div className="hub-prospects-top10-head">
        <div>
          <span><Sparkles size={14} /> TOP 10</span>
          <h2>Best opportunities to contact first</h2>
        </div>
        <small>Ranked from opportunity, contactability and business proof.</small>
      </div>

      <div className="hub-prospects-top10-grid">
        {top.map((prospect, index) => (
          <div key={prospect.id} className="hub-prospects-top10-item">
            <span className="hub-prospects-top10-rank">{index + 1}</span>

            <div className="hub-prospects-top10-company">
              <strong>{prospect.name}</strong>
              <small>{[prospect.city, prospect.category].filter(Boolean).join(" · ") || "Local business"}</small>
              <div className="hub-prospects-top10-tags">
                {prospect.reasons.map((reason) => <span key={reason}>{reason}</span>)}
              </div>
            </div>

            <div className="hub-prospects-top10-contact" title={prospect.email || prospect.phone || "Contact available"}>
              {prospect.email ? <Mail size={13} /> : <Phone size={13} />}
            </div>

            <strong className="hub-prospects-top10-score">{prospect.priorityScore}</strong>

            <Link
              href={`/hub/prospects?q=${encodeURIComponent(prospect.name)}`}
              className="hub-prospects-top10-review"
            >
              Review <ArrowUpRight size={12} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
