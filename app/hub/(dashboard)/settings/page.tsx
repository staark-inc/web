import {
  BarChart3,
  CheckCircle2,
  ExternalLink,
  GitCommitHorizontal,
  Mail,
  RefreshCw,
  Save,
  Search,
  Send,
  Server,
} from "lucide-react";
import { GitMerge } from "lucide-react";
import { redirect } from "next/navigation";
import { getGitHubOverview } from "@/lib/github";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SettingsSearchParams = Promise<{
  updated?: string;
  error?: string;
  smtp?: string;
}>;

function formatConnectedDate(date: Date | null) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function HubSettingsPage({
  searchParams,
}: {
  searchParams: SettingsSearchParams;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/hub/login");
  }

  const params = await searchParams;

  const settings = await prisma.settings.findUnique({
    where: {
      id: "default",
    },
  });

  const senderName =
    settings?.senderName ?? "Staark Inc.";

  const senderEmail =
    settings?.senderEmail ?? "contact@staarkinc.com";

  const signature =
    settings?.signature ??
    `Med vänliga hälsningar,

Ionuț
Staark Inc.
staarkinc.com`;

  const defaultTemplate =
    settings?.defaultTemplate ?? "staark-standard";

  const analyticsConnected =
    Boolean(settings?.ga4RefreshToken);

  const analyticsConnectedAt =
    formatConnectedDate(
      settings?.ga4ConnectedAt ?? null
    );

  const githubResult = await getGitHubOverview()
    .then((data) => ({
      connected: true as const,
      data,
    }))
    .catch((error) => {
      console.error(
        "Failed to load GitHub integration:",
        error
      );

      return {
        connected: false as const,
        data: null,
      };
    });

  const github = githubResult.data;

  return (
    <div className="hub-page hub-settings-page">
      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">
            STAARK HUB
          </span>

          <h1>Settings</h1>

          <p>
            Configure email and integrations used by
            Staark Hub.
          </p>
        </div>
      </header>

      {params.updated === "1" ? (
        <div className="hub-profile-alert hub-profile-alert-success">
          <CheckCircle2 size={17} />

          <div>
            <strong>Settings saved</strong>
            <span>
              Your Staark Hub settings have been updated.
            </span>
          </div>
        </div>
      ) : null}

      {params.error ? (
        <div className="hub-profile-alert hub-profile-alert-error">
          <Mail size={17} />

          <div>
            <strong>
              Couldn&apos;t save settings
            </strong>

            <span>
              {params.error === "invalid_email"
                ? "Please enter a valid sender email address."
                : params.error === "invalid_name"
                  ? "Please enter a valid sender name."
                  : "Something went wrong. Please try again."}
            </span>
          </div>
        </div>
      ) : null}

      <form
        action="/api/hub/settings"
        method="post"
      >
        {/* EMAIL */}

        <section className="hub-settings-card">
          <div className="hub-settings-heading">
            <div className="hub-settings-icon">
              <Mail size={19} />
            </div>

            <div>
              <h2>Email</h2>

              <p>
                Default settings for outgoing messages.
              </p>
            </div>
          </div>

          <div className="hub-settings-grid">
            <label className="hub-settings-field">
              <span>Sender name</span>

              <input
                type="text"
                name="senderName"
                defaultValue={senderName}
                required
                minLength={2}
                maxLength={80}
              />
            </label>

            <label className="hub-settings-field">
              <span>Sender email</span>

              <input
                type="email"
                name="senderEmail"
                defaultValue={senderEmail}
                required
                maxLength={160}
              />
            </label>

            <label className="hub-settings-field hub-settings-full">
              <span>Email signature</span>

              <textarea
                name="signature"
                rows={6}
                defaultValue={signature}
                maxLength={2000}
              />
            </label>
          </div>
        </section>

        {/* TEMPLATE */}

        <section className="hub-settings-card">
          <div className="hub-settings-heading">
            <div className="hub-settings-icon">
              <Send size={19} />
            </div>

            <div>
              <h2>Template</h2>

              <p>
                Choose the default template for outgoing
                email.
              </p>
            </div>
          </div>

          <label className="hub-settings-field">
            <span>Default template</span>

            <select
              name="defaultTemplate"
              defaultValue={defaultTemplate}
            >
              <option value="staark-standard">
                Staark Standard
              </option>
            </select>
          </label>

          <div className="hub-settings-actions">
            <button
              className="hub-send-button"
              type="submit"
            >
              Save settings
              <Save size={16} />
            </button>
          </div>
        </section>
      </form>

      {/* INTEGRATIONS */}

      <section className="hub-settings-card">
        <div className="hub-settings-heading">
          <div className="hub-settings-icon">
            <BarChart3 size={19} />
          </div>

          <div>
            <h2>Integrations</h2>

            <p>
              External services connected to Staark Hub.
            </p>
          </div>
        </div>

        <div className="hub-integration-row">
          <div className="hub-integration-main">
            <div className="hub-integration-logo">
              <BarChart3 size={18} />
            </div>

            <div className="hub-integration-info">
              <strong>Google Analytics</strong>

              <span>
                Website traffic and visitor analytics
              </span>
            </div>
          </div>

          <div className="hub-integration-actions">
            {analyticsConnected ? (
              <>
                <div className="hub-integration-status">
                  <span className="hub-integration-dot" />
                  Connected
                </div>

                <a
                  href="/api/hub/google/connect"
                  className="hub-secondary-button"
                >
                  <RefreshCw size={14} />
                  Reconnect
                </a>
              </>
            ) : (
              <a
                href="/api/hub/google/connect"
                className="hub-send-button"
              >
                Connect
                <BarChart3 size={15} />
              </a>
            )}
          </div>
        </div>

        <div className="hub-integration-row">
          <div className="hub-integration-main">
            <div className="hub-integration-logo">
              <Search size={18} />
            </div>

            <div className="hub-integration-info">
              <strong>Google Search Console</strong>

              <span>
                Search performance, clicks and Google rankings
              </span>
            </div>
          </div>

          <div className="hub-integration-actions">
            {analyticsConnected ? (
              <div className="hub-integration-status">
                <span className="hub-integration-dot" />
                Connected
              </div>
            ) : (
              <span className="hub-integration-status hub-integration-status-offline">
                Not connected
              </span>
            )}
          </div>
        </div>

        <div className="hub-integration-row">
          <div className="hub-integration-main">
            <div className="hub-integration-logo">
              <Server size={18} />
            </div>

            <div className="hub-integration-info">
              <strong>Email / SMTP</strong>

              <span>
                Outgoing email server and authentication
              </span>
            </div>
          </div>

          <div className="hub-integration-actions">
            {params.smtp === "success" ? (
              <div className="hub-integration-status">
                <span className="hub-integration-dot" />
                Connected
              </div>
            ) : params.smtp === "error" ? (
              <div className="hub-integration-status hub-integration-status-offline">
                Connection failed
              </div>
            ) : (
              <div className="hub-integration-status hub-integration-status-neutral">
                Ready to test
              </div>
            )}

            <form
              action="/api/hub/email-test"
              method="post"
            >
              <button
                type="submit"
                className="hub-secondary-button"
              >
                <RefreshCw size={14} />
                Test connection
              </button>
            </form>
          </div>
        </div>

        <div className="hub-integration-row hub-github-integration">
          <div className="hub-integration-main">
            <div className="hub-integration-logo">
              <GitMerge size={18} />
            </div>

            <div className="hub-integration-info">
              <strong>GitHub</strong>

              <span>
                Repository, commits and deployment workflows
              </span>
            </div>
          </div>

          <div className="hub-integration-actions">
            {githubResult.connected && github ? (
              <div className="hub-integration-status">
                <span className="hub-integration-dot" />
                Connected
              </div>
            ) : (
              <div className="hub-integration-status hub-integration-status-offline">
                Unavailable
              </div>
            )}
          </div>
        </div>

        {githubResult.connected && github ? (
          <div className="hub-github-details">
            <div className="hub-github-detail">
              <span>Repository</span>

              <strong>
                {github.repository.fullName}
              </strong>
            </div>

            <div className="hub-github-detail">
              <span>Branch</span>

              <strong>
                {github.branch.name}
              </strong>
            </div>

            <div className="hub-github-detail">
              <span>Latest commit</span>

              <strong className="hub-github-sha">
                <GitCommitHorizontal size={14} />
                {github.commit.shortSha}
              </strong>
            </div>

            <div className="hub-github-detail">
              <span>Workflow</span>

              <strong
                className={
                  github.workflow?.conclusion === "success"
                    ? "hub-github-success"
                    : github.workflow?.conclusion === "failure"
                      ? "hub-github-failure"
                      : ""
                }
              >
                {github.workflow
                  ? github.workflow.status === "completed"
                    ? github.workflow.conclusion ?? "Completed"
                    : github.workflow.status
                  : "No workflow"}
              </strong>
            </div>

            <div className="hub-github-commit">
              <div>
                <span>Latest commit</span>

                <strong>
                  {github.commit.message}
                </strong>

                <small>
                  {github.commit.author}
                </small>
              </div>

              <a
                href={github.commit.url}
                target="_blank"
                rel="noreferrer"
                className="hub-secondary-button"
              >
                View commit
                <ExternalLink size={13} />
              </a>
            </div>

            <div className="hub-github-links">
              <a
                href={github.repository.url}
                target="_blank"
                rel="noreferrer"
                className="hub-secondary-button"
              >
                <GitMerge size={14} />
                Repository
                <ExternalLink size={12} />
              </a>

              {github.workflow ? (
                <a
                  href={github.workflow.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hub-secondary-button"
                >
                  <BarChart3 size={14} />
                  Latest workflow
                  <ExternalLink size={12} />
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="hub-integration-meta">
            GitHub App connection could not be verified.
          </div>
        )}

        <div className="hub-integration-meta">
          SMTP server configured
          {process.env.SMTP_HOST
            ? ` · ${process.env.SMTP_HOST}`
            : ""}
        </div>

        {analyticsConnectedAt ? (
          <div className="hub-integration-meta">
            Google account connected on {analyticsConnectedAt}
          </div>
        ) : null}
      </section>
    </div>
  );
}