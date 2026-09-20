import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DeleteContactPage({
  params,
}: PageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/hub/login");
  }

  const { id } = await params;

  const contact =
    await prisma.contact.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

  if (!contact) {
    notFound();
  }

  return (
    <div className="hub-page">
      <div className="hub-detail-back">
        <Link
          href={`/hub/contacts/${contact.id}`}
        >
          <ArrowLeft size={16} />
          Back to client
        </Link>
      </div>

      <section className="hub-detail-card">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          <AlertTriangle
            size={24}
          />

          <div>
            <h2>
              Delete client
            </h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {contact.name ||
                  contact.email}
              </strong>
              ?
            </p>

            <p>
              This will also delete{" "}
              {contact._count.leads}{" "}
              {contact._count.leads === 1
                ? "lead"
                : "leads"}{" "}
              connected to this client.
            </p>

            <p>
              Existing email messages will be
              kept in the inbox and sent
              history.
            </p>
          </div>
        </div>

        <div
          className="hub-settings-actions"
          style={{
            marginTop: 24,
          }}
        >
          <Link
            href={`/hub/contacts/${contact.id}`}
            className="hub-secondary-button"
          >
            Cancel
          </Link>

          <form
            action={`/api/hub/contacts/${contact.id}/delete`}
            method="post"
          >
            <button
              type="submit"
              className="hub-danger-button"
            >
              <Trash2 size={15} />
              Delete client
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}