import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

import { prisma } from "@/lib/prisma";

import ProjectForm from "../ProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="hub-page">
      <div className="hub-detail-back">
        <Link href="/hub/projects">
          <ArrowLeft size={16} />
          Projects
        </Link>
      </div>

      <div className="hub-page-header">
        <div>
          <h1>New project</h1>

          <p>Track delivery for one of your clients.</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="hub-empty-state">
          <Building2 size={28} />

          <h2>No clients yet</h2>

          <p>
            A project belongs to a client, so add a client first.
          </p>

          <Link href="/hub/clients" className="hub-secondary-button">
            Go to clients
          </Link>
        </div>
      ) : (
        <section className="hub-client-panel">
          <ProjectForm clients={clients} />
        </section>
      )}
    </div>
  );
}
