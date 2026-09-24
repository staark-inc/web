import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { getEmailTemplates } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import ComposeForm from "./ComposeForm";

type PageProps = {
  searchParams: Promise<{
    replyTo?: string;
    subject?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function HubComposePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [contacts, templates, settings] = await Promise.all([
    prisma.contact.findMany({
      where: { email: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 120,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        leads: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            service: true,
            message: true,
          },
        },
        clients: {
          take: 1,
          select: { id: true },
        },
        threads: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            id: true,
            subject: true,
            updatedAt: true,
          },
        },
      },
    }),
    getEmailTemplates(),
    prisma.settings.findUnique({
      where: { id: "default" },
      select: {
        senderName: true,
        senderEmail: true,
        signature: true,
      },
    }),
  ]);

  const recipients = contacts.flatMap((contact) => {
    if (!contact.email) return [];

    const kind: "Contact" | "Lead" | "Client" =
      contact.clients.length > 0
        ? "Client"
        : contact.leads.length > 0
          ? "Lead"
          : "Contact";

    return [{
      id: contact.id,
      name: contact.name ?? contact.email,
      email: contact.email,
      company: contact.company ?? "",
      kind,
      leadService: contact.leads[0]?.service ?? "",
      leadMessage: contact.leads[0]?.message ?? "",
      lastThreadId: contact.threads[0]?.id ?? "",
      lastThreadSubject: contact.threads[0]?.subject ?? "",
      lastThreadAt: contact.threads[0]?.updatedAt.toISOString() ?? "",
    }];
  });

  const availableTemplates = templates
    .filter((template) => template.active)
    .map((template) => ({
      key: template.key,
      name: template.name,
      description: template.description,
      subject: template.subject,
      body: template.body,
    }));

  return (
    <div className="hub-page hub-mail-v2-page">
      <header className="hub-page-header hub-mail-v2-header">
        <div>
          <Link href="/hub/inbox" className="hub-back">
            <ArrowLeft size={16} />
            Inbox
          </Link>
          <span className="hub-eyebrow">MAIL WORKSPACE</span>
          <h1>New message</h1>
          <p>Write, preview and send client communication from one place.</p>
        </div>
      </header>

      <ComposeForm
        initialTo={params.replyTo ?? ""}
        initialSubject={params.subject ?? ""}
        recipients={recipients}
        templates={availableTemplates}
        senderName={settings?.senderName ?? "Staark Inc."}
        senderEmail={settings?.senderEmail ?? "contact@staarkinc.com"}
        signature={settings?.signature ?? ""}
      />
    </div>
  );
}
