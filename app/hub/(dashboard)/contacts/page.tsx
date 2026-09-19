import Link from "next/link";
import {
  Building2,
  Mail,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: {
      createdAt: "desc",
    },

    include: {
      _count: {
        select: {
          leads: true,
        },
      },
    },
  });

  return (
    <div className="hub-page">
      <div className="hub-page-header">
        <div>
          <h1>Contacts</h1>
          <p>
            People who have contacted Staark Inc.
          </p>
        </div>

        <div className="hub-header-count">
          {contacts.length} contacts
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="hub-empty-state">
          <UserRound size={28} />

          <h2>No contacts yet</h2>

          <p>
            New contacts will appear here when
            someone submits the contact form.
          </p>
        </div>
      ) : (
        <div className="hub-contact-list">
          {contacts.map((contact) => {
            const initials = contact.name
              ? contact.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()
              : contact.email
                  .slice(0, 2)
                  .toUpperCase();

            return (
              <Link
                key={contact.id}
                href={`/hub/contacts/${contact.id}`}
                className="hub-contact-row"
              >
                <div className="hub-contact-avatar">
                  {initials}
                </div>

                <div className="hub-contact-main">
                  <div className="hub-contact-name">
                    {contact.name ||
                      "Unknown contact"}
                  </div>

                  <div className="hub-contact-email">
                    <Mail size={14} />

                    {contact.email}
                  </div>

                  {contact.company && (
                    <div className="hub-contact-company">
                      <Building2 size={14} />

                      {contact.company}
                    </div>
                  )}
                </div>

                <div className="hub-contact-meta">
                  <strong>
                    {contact._count.leads}
                  </strong>

                  <span>
                    {contact._count.leads === 1
                      ? "lead"
                      : "leads"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}