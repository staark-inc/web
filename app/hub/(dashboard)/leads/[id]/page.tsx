import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import LeadStatusForm from "./LeadStatusForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function LeadPage({
  params,
}: PageProps) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: {
      id,
    },

    include: {
      contact: true,
    },
  });

  if (!lead) {
    notFound();
  }

  return (
    <div className="hub-page">
      <div className="hub-detail-back">
        <Link href="/hub/leads">
          <ArrowLeft size={16} />
          Leads
        </Link>
      </div>

      <div className="hub-page-header">
        <div>
          <h1>
            {lead.service || "General enquiry"}
          </h1>

          <p>
            Created {formatDate(lead.createdAt)}
          </p>
        </div>

        <span
          className={`hub-lead-status hub-lead-status-${lead.status.toLowerCase()}`}
        >
          {lead.status}
        </span>
      </div>

      <div className="hub-detail-grid">
        <section className="hub-detail-card">
          <h2>Lead details</h2>

          <div className="hub-lead-detail-fields">
            <div>
              <span>Service</span>
              <strong>
                {lead.service || "Not specified"}
              </strong>
            </div>

            <div>
              <span>Budget</span>
              <strong>
                {lead.budget || "Not specified"}
              </strong>
            </div>

            <div>
              <span>Status</span>

              <LeadStatusForm
                leadId={lead.id}
                currentStatus={lead.status}
              />
            </div>
          </div>
        </section>

        <section className="hub-detail-card">
          <h2>Contact</h2>

          <Link
            href={`/hub/contacts/${lead.contact.id}`}
            className="hub-lead-contact"
          >
            <UserRound size={18} />

            <div>
              <strong>
                {lead.contact.name ||
                  "Unknown contact"}
              </strong>

              <span>
                <Mail size={13} />
                {lead.contact.email}
              </span>

              {lead.contact.company && (
                <span>
                  <Building2 size={13} />
                  {lead.contact.company}
                </span>
              )}
            </div>
          </Link>
        </section>
      </div>

      <section className="hub-detail-card hub-lead-message-card">
        <h2>Message</h2>

        <div className="hub-lead-message">
          {lead.message ||
            "No message was provided."}
        </div>
      </section>
    </div>
  );
}