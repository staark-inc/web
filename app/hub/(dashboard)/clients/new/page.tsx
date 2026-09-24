import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";

import ClientForm from "../ClientForm";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    contactId?: string;
  }>;
};

export default async function NewClientPage({ searchParams }: PageProps) {
  const { contactId } = await searchParams;

  /*
   * Opened from a contact page: prefill the form and link
   * that contact to the client once it is created.
   */
  const contact = contactId
    ? await prisma.contact.findUnique({
        where: { id: contactId },
        select: { id: true, name: true, email: true, company: true },
      })
    : null;

  const contactLabel = contact
    ? contact.name ?? contact.email ?? contact.company ?? "This contact"
    : null;

  return (
    <div className="hub-page">
      <div className="hub-detail-back">
        <Link href={contact ? `/hub/contacts/${contact.id}` : "/hub/clients"}>
          <ArrowLeft size={16} />
          {contact ? "Contact" : "Clients"}
        </Link>
      </div>

      <div className="hub-page-header">
        <div>
          <h1>New client</h1>

          <p>
            {contact
              ? `${contactLabel} will be linked to this client.`
              : "Add a company you work with."}
          </p>
        </div>
      </div>

      <section className="hub-client-panel">
        <ClientForm
          contactId={contact?.id}
          defaultName={contact?.company ?? contact?.name ?? undefined}
          defaultEmail={contact?.email ?? undefined}
        />
      </section>
    </div>
  );
}
