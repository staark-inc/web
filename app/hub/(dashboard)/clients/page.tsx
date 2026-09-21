import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FolderKanban,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function ClientsPage() {
  const [clients, totalClients, linkedContacts, convertedLeads] =
    await Promise.all([
      prisma.client.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          billingEmail: true,
          createdAt: true,
          contacts: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { leads: true },
          },
        },
      }),
      prisma.client.count(),
      prisma.contact.count({
        where: { clients: { some: {} } },
      }),
      prisma.lead.count({
        where: { clientId: { not: null } },
      }),
    ]);

  return (
    <main className="mx-auto w-full max-w-[1180px] px-6 py-10 lg:px-10">
      <div className="mb-9">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Staark Hub / CRM
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Clients
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Companies you work with, their projects and commercial details.
        </p>
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Building2 size={19} />}
          label="Clients"
          value={String(totalClients)}
          detail="Confirmed client records"
        />
        <StatCard
          icon={<UsersRound size={19} />}
          label="Linked contacts"
          value={String(linkedContacts)}
          detail="People connected to clients"
        />
        <StatCard
          icon={<UserRoundPlus size={19} />}
          label="Converted leads"
          value={String(convertedLeads)}
          detail="Leads linked to clients"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              Client directory
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Your confirmed clients will be listed here.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-5"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {client.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {client.billingEmail ??
                      client.contacts[0]?.email ??
                      "No email added"}
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p>{client.contacts.length} contacts</p>
                  <p className="mt-1">{client._count.leads} linked leads</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center px-6 py-20 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <Building2 size={25} strokeWidth={1.7} />
          </div>

          <h3 className="text-base font-semibold text-slate-950">
            No clients yet
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Once a lead becomes a client, their company, contacts, projects,
            offers and support history will be available here.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/hub/leads"
              style={{ color: "white", fontSize: "13px" }}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <UserRoundPlus size={16} />
              View leads
            </Link>

            <Link
              href="/hub/contacts"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View contacts
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <p className="mt-10 text-xs text-slate-500" style={{ marginTop: "10px" }}>
        Next step: connect this page to the Client model and add the
        “Convert lead to client” action.
      </p>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </span>
      </div>
      <strong className="mt-2 block text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </strong>
      <span className="mt-1 block text-xs text-slate-500">{detail}</span>
    </div>
  );
}