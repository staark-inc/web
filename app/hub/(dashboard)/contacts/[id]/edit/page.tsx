import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type EditContactPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditContactPage({
  params,
  searchParams,
}: EditContactPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/hub/login");
  }

  const { id } = await params;
  const query = await searchParams;

  const contact =
    await prisma.contact.findUnique({
      where: {
        id,
      },
    });

  if (!contact) {
    notFound();
  }

  return (
    <div className="hub-page hub-settings-page">
      <div className="hub-detail-back">
        <Link
          href={`/hub/contacts/${contact.id}`}
        >
          <ArrowLeft size={15} />
          Back to client
        </Link>
      </div>

      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">
            STAARK HUB
          </span>

          <h1>Edit client</h1>

          <p>
            Update contact information for{" "}
            {contact.name}.
          </p>
        </div>
      </header>

      {query.error ? (
        <div className="hub-profile-alert hub-profile-alert-error">
          <div>
            <strong>
              Couldn&apos;t save client
            </strong>

            <span>
              {query.error ===
              "email_exists"
                ? "Another client already uses this email address."
                : query.error ===
                    "invalid"
                  ? "Check the name and email address."
                  : "Something went wrong. Please try again."}
            </span>
          </div>
        </div>
      ) : null}

      <section className="hub-settings-card">
        <div className="hub-settings-heading">
          <div className="hub-settings-icon">
            <UserRound size={19} />
          </div>

          <div>
            <h2>Client information</h2>

            <p>
              Edit the client&apos;s contact
              details.
            </p>
          </div>
        </div>

        <form
          action={`/api/hub/contacts/${contact.id}`}
          method="post"
        >
          <div className="hub-settings-grid">
            <label className="hub-settings-field">
              <span>Name</span>

              <div className="hub-input-icon">
                <UserRound size={16} />

                <input
                  type="text"
                  name="name"
                  defaultValue={contact.name ?? ""}
                  required
                  maxLength={120}
                  autoComplete="name"
                />
              </div>
            </label>

            <label className="hub-settings-field">
              <span>Email</span>

              <div className="hub-input-icon">
                <Mail size={16} />

                <input
                  type="email"
                  name="email"
                  defaultValue={contact.email ?? ""}
                  required
                  maxLength={320}
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="hub-settings-field">
              <span>Phone</span>

              <div className="hub-input-icon">
                <Phone size={16} />

                <input
                  type="tel"
                  name="phone"
                  defaultValue={
                    contact.phone ?? ""
                  }
                  maxLength={80}
                  autoComplete="tel"
                />
              </div>
            </label>

            <label className="hub-settings-field">
              <span>Company</span>

              <div className="hub-input-icon">
                <Building2 size={16} />

                <input
                  type="text"
                  name="company"
                  defaultValue={
                    contact.company ?? ""
                  }
                  maxLength={160}
                  autoComplete="organization"
                />
              </div>
            </label>
          </div>

          <div className="hub-settings-actions">
            <Link
              href={`/hub/contacts/${contact.id}`}
              className="hub-secondary-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="hub-send-button"
            >
              Save changes
              <Save size={16} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}