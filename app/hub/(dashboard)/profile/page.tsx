import {
  KeyRound,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProfileSearchParams = Promise<{
  updated?: string;
  password?: string;
  error?: string;
}>;

function getInitials(name: string, email: string) {
  if (name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

function formatMemberSince(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function HubProfilePage({
  searchParams,
}: {
  searchParams: ProfileSearchParams;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/hub/login");
  }

  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!user) {
    redirect("/hub/login");
  }

  const initials = getInitials(
    user.name,
    user.email
  );

  return (
    <div className="hub-page hub-settings-page">
      {/* HEADER */}

      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">
            STAARK HUB
          </span>

          <h1>Profile</h1>

          <p>
            Manage your personal information and
            account security.
          </p>
        </div>
      </header>

      {/* SUCCESS / ERROR MESSAGES */}

      {params.updated === "1" ? (
        <div className="hub-profile-alert hub-profile-alert-success">
          <ShieldCheck size={17} />

          <div>
            <strong>Profile updated</strong>
            <span>
              Your personal information has been saved.
            </span>
          </div>
        </div>
      ) : null}

      {params.password === "1" ? (
        <div className="hub-profile-alert hub-profile-alert-success">
          <ShieldCheck size={17} />

          <div>
            <strong>Password changed</strong>
            <span>
              Your new password is now active.
            </span>
          </div>
        </div>
      ) : null}

      {params.error ? (
        <div className="hub-profile-alert hub-profile-alert-error">
          <LockKeyhole size={17} />

          <div>
            <strong>
              Couldn&apos;t save changes
            </strong>

            <span>
              {params.error === "email_exists"
                ? "That email address is already in use."
                : params.error === "current_password"
                  ? "Your current password is incorrect."
                  : params.error === "password_match"
                    ? "The new passwords do not match."
                    : params.error === "password_length"
                      ? "The new password must contain at least 8 characters."
                      : params.error === "invalid"
                        ? "Please check the information you entered."
                        : "Something went wrong. Please try again."}
            </span>
          </div>
        </div>
      ) : null}

      {/* PERSONAL INFORMATION */}

      <section className="hub-settings-card">
        <div className="hub-settings-heading">
          <div className="hub-settings-icon">
            <UserRound size={19} />
          </div>

          <div>
            <h2>Personal information</h2>

            <p>
              This information identifies you inside
              Staark Hub.
            </p>
          </div>
        </div>

        <div className="hub-profile-avatar-row">
          <div className="hub-profile-avatar">
            {initials}
          </div>

          <div className="hub-profile-avatar-info">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <form
          action="/api/hub/profile"
          method="post"
        >
          <input
            type="hidden"
            name="action"
            value="profile"
          />

          <div className="hub-settings-grid">
            <label className="hub-settings-field">
              <span>Name</span>

              <input
                type="text"
                name="name"
                defaultValue={user.name}
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
              />
            </label>

            <label className="hub-settings-field">
              <span>Role</span>

              <input
                type="text"
                value="Administrator"
                readOnly
                disabled
              />
            </label>

            <label className="hub-settings-field hub-settings-full">
              <span>Email</span>

              <div className="hub-input-icon">
                <Mail size={16} />

                <input
                  type="email"
                  name="email"
                  defaultValue={user.email}
                  required
                  maxLength={160}
                  autoComplete="email"
                />
              </div>
            </label>
          </div>

          <div className="hub-settings-actions">
            <button
              className="hub-send-button"
              type="submit"
            >
              Save changes
              <Save size={16} />
            </button>
          </div>
        </form>
      </section>

      {/* SECURITY */}

      <section className="hub-settings-card">
        <div className="hub-settings-heading">
          <div className="hub-settings-icon">
            <KeyRound size={19} />
          </div>

          <div>
            <h2>Security</h2>

            <p>
              Change the password used to access
              Staark Hub.
            </p>
          </div>
        </div>

        <form
          action="/api/hub/profile"
          method="post"
        >
          <input
            type="hidden"
            name="action"
            value="password"
          />

          <div className="hub-settings-grid">
            <label className="hub-settings-field hub-settings-full">
              <span>Current password</span>

              <div className="hub-input-icon">
                <LockKeyhole size={16} />

                <input
                  type="password"
                  name="currentPassword"
                  required
                  autoComplete="current-password"
                  placeholder="Enter current password"
                />
              </div>
            </label>

            <label className="hub-settings-field">
              <span>New password</span>

              <input
                type="password"
                name="newPassword"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
              />
            </label>

            <label className="hub-settings-field">
              <span>Confirm new password</span>

              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Repeat new password"
              />
            </label>
          </div>

          <div className="hub-settings-actions">
            <button
              className="hub-send-button"
              type="submit"
            >
              Change password
              <KeyRound size={16} />
            </button>
          </div>
        </form>
      </section>

      {/* ACCOUNT */}

      <section className="hub-settings-card">
        <div className="hub-settings-heading">
          <div className="hub-settings-icon">
            <ShieldCheck size={19} />
          </div>

          <div>
            <h2>Account</h2>

            <p>
              Information about your Staark Hub account.
            </p>
          </div>
        </div>

        <div className="hub-profile-account-grid">
          <div className="hub-profile-account-item">
            <span>Role</span>
            <strong>Administrator</strong>
          </div>

          <div className="hub-profile-account-item">
            <span>Member since</span>

            <strong>
              {formatMemberSince(
                user.createdAt
              )}
            </strong>
          </div>

          <div className="hub-profile-account-item">
            <span>Account ID</span>

            <strong className="hub-profile-account-id">
              {user.id}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}