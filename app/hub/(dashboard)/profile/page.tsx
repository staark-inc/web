import Link from "next/link";
import { cookies } from "next/headers";
import {
  BellDot,
  CircleCheck,
  Clock3,
  ExternalLink,
  Fingerprint,
  Globe2,
  IdCard,
  KeyRound,
  LayoutPanelLeft,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProfileSearchParams = Promise<{
  updated?: string;
  password?: string;
  preferences?: string;
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getRoleLabel(role: string) {
  return role === "ADMIN" ? "Administrator" : role;
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

  const [params, cookieStore] = await Promise.all([
    searchParams,
    cookies(),
  ]);

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!user) {
    redirect("/hub/login");
  }

  const initials = getInitials(user.name, user.email);
  const roleLabel = getRoleLabel(user.role);
  const sidebarMode =
    cookieStore.get("hub_sidebar")?.value === "compact"
      ? "compact"
      : "standard";
  const countMode =
    cookieStore.get("hub_counts")?.value === "hide"
      ? "hide"
      : "show";
  const timezone =
    cookieStore.get("hub_timezone")?.value ??
    "Europe/Stockholm";

  return (
    <div className="hub-page hub-profile-v2-page">
      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">STAARK HUB</span>
          <h1>Profile</h1>
          <p>
            Your identity, access, preferences and security settings in one place.
          </p>
        </div>
      </header>

      <section className="hub-profile-v2-hero">
        <div className="hub-profile-v2-identity">
          <div className="hub-profile-v2-avatar">{initials}</div>

          <div className="hub-profile-v2-identity-copy">
            <span className="hub-profile-v2-kicker">Personal workspace</span>
            <h1>{user.name}</h1>
            <p>{user.email}</p>

            <div className="hub-profile-v2-badges">
              <span className="hub-profile-v2-badge is-active">
                <CircleCheck size={13} />
                Active account
              </span>
              <span className="hub-profile-v2-badge">
                <ShieldCheck size={13} />
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="hub-profile-v2-hero-meta">
          <div>
            <span>Member since</span>
            <strong>{formatDate(user.createdAt)}</strong>
          </div>
          <div>
            <span>Last account update</span>
            <strong>{formatDate(user.updatedAt)}</strong>
          </div>
        </div>
      </section>

      {params.updated === "1" ? (
        <div className="hub-profile-v2-alert hub-profile-v2-alert-success">
          <ShieldCheck size={17} />
          <div>
            <strong>Profile updated</strong>
            <span>Your personal information has been saved.</span>
          </div>
        </div>
      ) : null}

      {params.password === "1" ? (
        <div className="hub-profile-v2-alert hub-profile-v2-alert-success">
          <ShieldCheck size={17} />
          <div>
            <strong>Password changed</strong>
            <span>Your new password is now active.</span>
          </div>
        </div>
      ) : null}

      {params.preferences === "1" ? (
        <div className="hub-profile-v2-alert hub-profile-v2-alert-success">
          <SlidersHorizontal size={17} />
          <div>
            <strong>Preferences saved</strong>
            <span>Your Hub workspace preferences are now active.</span>
          </div>
        </div>
      ) : null}

      {params.error ? (
        <div className="hub-profile-v2-alert hub-profile-v2-alert-error">
          <LockKeyhole size={17} />
          <div>
            <strong>Couldn&apos;t save changes</strong>
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

      <div className="hub-profile-v2-grid">
        <section className="hub-profile-v2-card">
          <div className="hub-profile-v2-card-head">
            <div className="hub-profile-v2-card-icon">
              <UserRound size={18} />
            </div>
            <div>
              <h2>Personal information</h2>
              <p>Update the details used to identify you across Staark Hub.</p>
            </div>
          </div>

          <div className="hub-profile-v2-card-body">
            <div className="hub-profile-v2-user-strip">
              <div className="hub-profile-v2-user-strip-avatar">{initials}</div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
            </div>

            <form action="/api/hub/profile" method="post">
              <input type="hidden" name="action" value="profile" />

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
                  <input type="text" value={roleLabel} readOnly disabled />
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
                <button className="hub-send-button" type="submit">
                  Save changes
                  <Save size={16} />
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="hub-profile-v2-card">
          <div className="hub-profile-v2-card-head">
            <div className="hub-profile-v2-card-icon">
              <IdCard size={18} />
            </div>
            <div>
              <h2>Account & access</h2>
              <p>Core account information and your current Hub access level.</p>
            </div>
          </div>

          <div className="hub-profile-v2-card-body">
            <div className="hub-profile-v2-facts">
              <div className="hub-profile-v2-fact">
                <div className="hub-profile-v2-fact-icon">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <span>Access role</span>
                  <strong>{roleLabel}</strong>
                </div>
              </div>

              <div className="hub-profile-v2-fact">
                <div className="hub-profile-v2-fact-icon">
                  <CircleCheck size={15} />
                </div>
                <div>
                  <span>Account status</span>
                  <strong>Active</strong>
                </div>
              </div>

              <div className="hub-profile-v2-fact">
                <div className="hub-profile-v2-fact-icon">
                  <KeyRound size={15} />
                </div>
                <div>
                  <span>Sign-in method</span>
                  <strong>Email + password</strong>
                </div>
              </div>

              <div className="hub-profile-v2-fact">
                <div className="hub-profile-v2-fact-icon">
                  <Clock3 size={15} />
                </div>
                <div>
                  <span>Member since</span>
                  <strong>{formatDate(user.createdAt)}</strong>
                </div>
              </div>

              <div className="hub-profile-v2-fact hub-profile-v2-account-id">
                <div className="hub-profile-v2-fact-icon">
                  <Fingerprint size={15} />
                </div>
                <div>
                  <span>Account ID</span>
                  <strong title={user.id}>{user.id}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hub-profile-v2-card hub-profile-v2-card-full">
          <div className="hub-profile-v2-card-head hub-profile-v2-card-head-actions">
            <div className="hub-profile-v2-card-icon">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2>Workspace preferences</h2>
              <p>Adjust how your personal Staark Hub workspace behaves.</p>
            </div>

            <Link
              href="/hub/profile/notifications"
              className="hub-profile-v2-head-link"
            >
              <BellDot size={13} />
              Notifications
            </Link>

            <Link
              href="/hub/settings"
              className="hub-profile-v2-head-link"
              style={{ marginLeft: 0 }}
            >
              Workspace settings
              <ExternalLink size={13} />
            </Link>
          </div>

          <div className="hub-profile-v2-card-body">
            <form action="/api/hub/profile" method="post">
              <input type="hidden" name="action" value="preferences" />

              <div className="hub-profile-v2-preferences-grid">
                <fieldset className="hub-profile-v2-preference-group">
                  <legend>
                    <LayoutPanelLeft size={15} />
                    Sidebar layout
                  </legend>
                  <p>Choose between the full navigation or a compact icon rail.</p>

                  <div className="hub-profile-v2-choice-grid">
                    <label className="hub-profile-v2-choice">
                      <input
                        type="radio"
                        name="sidebar"
                        value="standard"
                        defaultChecked={sidebarMode === "standard"}
                      />
                      <span>
                        <strong>Standard</strong>
                        <small>Labels and icons</small>
                      </span>
                    </label>

                    <label className="hub-profile-v2-choice">
                      <input
                        type="radio"
                        name="sidebar"
                        value="compact"
                        defaultChecked={sidebarMode === "compact"}
                      />
                      <span>
                        <strong>Compact</strong>
                        <small>Icons only</small>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <fieldset className="hub-profile-v2-preference-group">
                  <legend>
                    <BellDot size={15} />
                    Navigation counters
                  </legend>
                  <p>Control Inbox and Leads number badges in the sidebar.</p>

                  <div className="hub-profile-v2-choice-grid">
                    <label className="hub-profile-v2-choice">
                      <input
                        type="radio"
                        name="counts"
                        value="show"
                        defaultChecked={countMode === "show"}
                      />
                      <span>
                        <strong>Show</strong>
                        <small>Keep counters visible</small>
                      </span>
                    </label>

                    <label className="hub-profile-v2-choice">
                      <input
                        type="radio"
                        name="counts"
                        value="hide"
                        defaultChecked={countMode === "hide"}
                      />
                      <span>
                        <strong>Hide</strong>
                        <small>Cleaner navigation</small>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <label className="hub-profile-v2-preference-group hub-profile-v2-timezone">
                  <span className="hub-profile-v2-preference-title">
                    <Globe2 size={15} />
                    Timezone
                  </span>
                  <p>Used as your personal time display preference inside Hub.</p>
                  <select name="timezone" defaultValue={timezone}>
                    <option value="Europe/Stockholm">Europe/Stockholm</option>
                    <option value="Europe/Bucharest">Europe/Bucharest</option>
                    <option value="UTC">UTC</option>
                  </select>
                </label>
              </div>

              <div className="hub-profile-v2-preference-footer">
                <div className="hub-profile-v2-current-preferences">
                  <span>Current workspace</span>
                  <strong>
                    {sidebarMode === "compact" ? "Compact" : "Standard"} sidebar · {countMode === "show" ? "Counters on" : "Counters off"} · {timezone}
                  </strong>
                </div>

                <button className="hub-send-button" type="submit">
                  Save preferences
                  <Save size={16} />
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="hub-profile-v2-card hub-profile-v2-card-full">
          <div className="hub-profile-v2-card-head">
            <div className="hub-profile-v2-card-icon">
              <KeyRound size={18} />
            </div>
            <div>
              <h2>Security</h2>
              <p>Change the password used to access your Staark Hub account.</p>
            </div>
          </div>

          <div className="hub-profile-v2-card-body">
            <div className="hub-profile-v2-security-layout">
              <form action="/api/hub/profile" method="post">
                <input type="hidden" name="action" value="password" />

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
                  <button className="hub-send-button" type="submit">
                    Change password
                    <KeyRound size={16} />
                  </button>
                </div>
              </form>

              <aside className="hub-profile-v2-security-aside">
                <strong>Security overview</strong>

                <div className="hub-profile-v2-security-points">
                  <div className="hub-profile-v2-security-point">
                    <div className="hub-profile-v2-security-point-icon">
                      <LockKeyhole size={14} />
                    </div>
                    <div>
                      <span>Authentication</span>
                      <strong>Password required</strong>
                    </div>
                  </div>

                  <div className="hub-profile-v2-security-point">
                    <div className="hub-profile-v2-security-point-icon">
                      <ShieldCheck size={14} />
                    </div>
                    <div>
                      <span>Permission level</span>
                      <strong>{roleLabel}</strong>
                    </div>
                  </div>

                  <div className="hub-profile-v2-security-point">
                    <div className="hub-profile-v2-security-point-icon">
                      <CircleCheck size={14} />
                    </div>
                    <div>
                      <span>Account</span>
                      <strong>Active</strong>
                    </div>
                  </div>
                </div>

                <p className="hub-profile-v2-security-note">
                  Password changes take effect immediately for future sign-ins.
                </p>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
