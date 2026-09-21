import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";

import { prisma } from "@/lib/prisma";

import ProjectForm from "../ProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; offerId?: string }>;
}) {
  const { clientId, offerId } = await searchParams;

  const [clients, sourceOffer] = await Promise.all([
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    offerId
      ? prisma.offer.findUnique({
          where: { id: offerId },
          select: {
            id: true,
            title: true,
            scope: true,
            oneTimePriceOre: true,
            status: true,
            clientId: true,
            project: { select: { id: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  if (offerId && (!sourceOffer || sourceOffer.status !== "ACCEPTED")) {
    notFound();
  }

  if (sourceOffer?.project) {
    redirect(`/hub/projects/${sourceOffer.project.id}`);
  }

  const resolvedClientId =
    sourceOffer?.clientId ??
    (clients.some((client) => client.id === clientId)
      ? clientId
      : undefined);

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
          <h1>{sourceOffer ? "Start project" : "New project"}</h1>

          <p>
            {sourceOffer
              ? `Creating delivery from accepted offer: ${sourceOffer.title}`
              : "Track delivery for one of your clients."}
          </p>
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
          <ProjectForm
            clients={clients}
            defaultClientId={resolvedClientId}
            defaultName={sourceOffer?.title}
            defaultDescription={sourceOffer?.scope ?? undefined}
            defaultBudget={
              sourceOffer?.oneTimePriceOre !== null &&
              sourceOffer?.oneTimePriceOre !== undefined
                ? String(sourceOffer.oneTimePriceOre / 100)
                : undefined
            }
            sourceOffer={
              sourceOffer
                ? {
                    id: sourceOffer.id,
                    title: sourceOffer.title,
                  }
                : undefined
            }
          />
        </section>
      )}
    </div>
  );
}
