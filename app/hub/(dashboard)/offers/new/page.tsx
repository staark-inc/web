import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import OfferForm from "../OfferForm";

export const dynamic = "force-dynamic";

export default async function NewOfferPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const { clientId } = await searchParams;
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="hub-page">
      <div className="hub-detail-back"><Link href="/hub/offers"><ArrowLeft size={16} />Offers</Link></div>
      <div className="hub-page-header"><div><h1>New offer</h1><p>Put the scope, website price and ongoing terms in one place.</p></div></div>
      {clients.length === 0 ? (
        <div className="hub-empty-state"><Building2 size={28} /><h2>Add a client first</h2><p>Offers belong to a client.</p><Link href="/hub/clients/new" className="hub-secondary-button">New client</Link></div>
      ) : (
        <section className="hub-client-panel"><OfferForm clients={clients} defaultClientId={clients.some((client) => client.id === clientId) ? clientId : undefined} /></section>
      )}
    </div>
  );
}
