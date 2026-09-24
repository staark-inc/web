import Link from "next/link";

import {
  ArrowLeft,
  Building2,
  Globe2,
  Mail,
  Phone,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type EditContactPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditContactPage({ params, searchParams }: EditContactPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/hub/login");
  }

  const { id } = await params;
  const query = await searchParams;
  const contact = await prisma.contact.findUnique({ where: { id } });

  if (!contact) {
    notFound();
  }

  const displayName = contact.name || contact.company || contact.email || "this contact";

  return (
    <div className="hub-page hub-settings-page">
      <div className="hub-detail-back">
        <Link href={`/hub/contacts/${contact.id}`}>
          <ArrowLeft size={15} />
          Back to contact
        </Link>
      </div>

      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">STAARK HUB</span>
          <h1>Edit contact</h1>
          <p>Update contact information for {displayName}.</p>
        </div>
      </header>

      {query.error ? (
        <div className="hub-profile-alert hub-profile-alert-error">
          <div>
            <strong>Couldn&apos;t save contact</strong>
            <span>
              {query.error === "email_exists"
                ? "Another contact already uses this email address."
                : query.error === "invalid"
                  ? "Add a name and at least one contact method: email, phone or Facebook."
                  : "Something went wrong. Please try again."}
            </span>
          </div>
        </div>
      ) : null}

      <section className="hub-settings-card">
        <div className="hub-settings-heading">
          <div className="hub-settings-icon"><UserRound size={19} /></div>
          <div>
            <h2>Contact information</h2>
            <p>Email is optional. Keep at least one way to reach this contact.</p>
          </div>
        </div>

        <form action={`/api/hub/contacts/${contact.id}`} method="post">
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
              <span>Email <small>(optional)</small></span>
              <div className="hub-input-icon">
                <Mail size={16} />
                <input
                  type="email"
                  name="email"
                  defaultValue={contact.email ?? ""}
                  maxLength={320}
                  autoComplete="email"
                  placeholder="name@example.com"
                />
              </div>
            </label>

            <label className="hub-settings-field">
              <span>Phone / WhatsApp</span>
              <div className="hub-input-icon">
                <Phone size={16} />
                <input
                  type="tel"
                  name="phone"
                  defaultValue={contact.phone ?? ""}
                  maxLength={80}
                  autoComplete="tel"
                  placeholder="+46..."
                />
              </div>
            </label>

            <label className="hub-settings-field">
              <span>Facebook</span>
              <div className="hub-input-icon">
                <Globe2 size={16} />
                <input
                  type="url"
                  name="facebook"
                  defaultValue={contact.facebook ?? ""}
                  maxLength={500}
                  placeholder="https://facebook.com/..."
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
                  defaultValue={contact.company ?? ""}
                  maxLength={160}
                  autoComplete="organization"
                />
              </div>
            </label>
          </div>

          <div className="hub-settings-actions">
            <Link href={`/hub/contacts/${contact.id}`} className="hub-secondary-button">Cancel</Link>
            <button type="submit" className="hub-send-button">
              Save changes
              <Save size={16} />
            </button>
          </div>
        </form>
      </section>

      <section className="hub-settings-card" style={{ marginTop: 18 }}>
        <div className="hub-settings-heading">
          <div className="hub-settings-icon"><Trash2 size={19} /></div>
          <div>
            <h2>Danger zone</h2>
            <p>Permanently delete this contact and all connected leads.</p>
          </div>
        </div>

        <div className="hub-settings-actions">
          <Link href={`/hub/contacts/${contact.id}/delete`} className="hub-danger-button">
            <Trash2 size={15} />
            Delete contact
          </Link>
        </div>
      </section>
    </div>
  );
}
