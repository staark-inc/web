import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  GitMerge,
  Mail,
  Plug,
  RefreshCw,
  Search,
  Send,
  Server,
  ShieldCheck,
} from "lucide-react";

import { getSession } from "@/lib/auth";
import { getEmailDomainHealth } from "@/lib/email-health";
import {
  EMAIL_TEMPLATE_SAMPLE_VALUES,
  getEmailTemplates,
} from "@/lib/email-templates";
import { getGitHubOverview } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import { getStripeConfigStatus } from "@/lib/stripe";
import { GmailWatchButton, StripeTestButton } from "./IntegrationActions";
import TemplateEditor from "./TemplateEditor";

export const dynamic = "force-dynamic";

type SettingsTab = "email" | "templates" | "integrations";
type SettingsSearchParams = Promise<{
  tab?: string;
  template?: string;
  updated?: string;
  error?: string;
  test?: string;
  templateUpdated?: string;
  templateError?: string;
}>;

function isSettingsTab(value: string | undefined): value is SettingsTab {
  return value === "email" || value === "templates" || value === "integrations";
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
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
  const activeTab: SettingsTab = isSettingsTab(params.tab) ? params.tab : "email";

  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  const senderName = settings?.senderName ?? "Staark Inc.";
  const senderEmail = settings?.senderEmail ?? "contact@staarkinc.com";
  const replyToEmail = settings?.replyToEmail ?? senderEmail;
  const signature =
    settings?.signature ??
    `Med vänliga hälsningar,\n\nIonuț\nStaark Inc.\nstaarkinc.com`;

  const gmailConnected = Boolean(settings?.gmailRefreshToken);
  const gmailWatchActive = Boolean(
    gmailConnected &&
      settings?.gmailWatchExpiresAt &&
      settings.gmailWatchExpiresAt.getTime() > Date.now()
  );
  const analyticsConnected = Boolean(settings?.ga4RefreshToken);

  const emailHealth =
    activeTab === "email" ? await getEmailDomainHealth(senderEmail) : null;

  const templates = activeTab === "templates" ? await getEmailTemplates() : [];
  const selectedTemplate =
    templates.find((template) => template.key === params.template) ??
    templates[0] ??
    null;

  const githubResult =
    activeTab === "integrations"
      ? await getGitHubOverview()
          .then((data) => ({ connected: true as const, data }))
          .catch(() => ({ connected: false as const, data: null }))
      : { connected: false as const, data: null };

  const stripeStatus = getStripeConfigStatus();

  return (
    <div className="hub-page hub-settings-page hub-settings-v2-page">
      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">STAARK HUB</span>
          <h1>Settings</h1>
          <p>Manage communication, templates and connected services.</p>
        </div>
      </header>

      <nav className="hub-settings-v2-tabs" aria-label="Settings sections">
        <Link href="/hub/settings?tab=email" className={activeTab === "email" ? "is-active" : undefined}>
          <Mail size={16} />Email
        </Link>
        <Link href="/hub/settings?tab=templates" className={activeTab === "templates" ? "is-active" : undefined}>
          <Send size={16} />Templates
        </Link>
        <Link href="/hub/settings?tab=integrations" className={activeTab === "integrations" ? "is-active" : undefined}>
          <Plug size={16} />Integrations
        </Link>
      </nav>

      {params.updated === "1" && (
        <div className="hub-profile-alert hub-profile-alert-success">
          <CheckCircle2 size={17} />
          <div><strong>Settings saved</strong><span>Email settings have been updated.</span></div>
        </div>
      )}

      {params.test === "success" && (
        <div className="hub-profile-alert hub-profile-alert-success">
          <CheckCircle2 size={17} />
          <div><strong>Test email sent</strong><span>Check {replyToEmail} to confirm delivery.</span></div>
        </div>
      )}

      {(params.error || params.templateError || params.test === "error") && (
        <div className="hub-profile-alert hub-profile-alert-error">
          <AlertCircle size={17} />
          <div>
            <strong>Something needs attention</strong>
            <span>
              {params.error === "invalid_email"
                ? "Please enter a valid sender email address."
                : params.error === "invalid_reply_email"
                  ? "Please enter a valid reply-to email address."
                  : params.test === "error"
                    ? "The outgoing mail provider could not send the test message."
                    : "The settings could not be saved."}
            </span>
          </div>
        </div>
      )}

      {params.templateUpdated === "1" && (
        <div className="hub-profile-alert hub-profile-alert-success">
          <CheckCircle2 size={17} />
          <div><strong>Template saved</strong><span>The selected system template is up to date.</span></div>
        </div>
      )}

      {activeTab === "email" && (
        <div className="hub-settings-v2-stack">
          <form action="/api/hub/settings" method="post">
            <section className="hub-settings-card">
              <div className="hub-settings-heading">
                <div className="hub-settings-icon"><Mail size={19} /></div>
                <div><h2>Sender identity</h2><p>Default identity used for outgoing client communication.</p></div>
              </div>

              <div className="hub-settings-grid">
                <label className="hub-settings-field">
                  <span>Sender name</span>
                  <input name="senderName" defaultValue={senderName} required minLength={2} maxLength={80} />
                </label>
                <label className="hub-settings-field">
                  <span>From address</span>
                  <input type="email" name="senderEmail" defaultValue={senderEmail} required maxLength={160} />
                </label>
                <label className="hub-settings-field hub-settings-full">
                  <span>Reply-to address</span>
                  <input type="email" name="replyToEmail" defaultValue={replyToEmail} maxLength={160} />
                  <small>Customer replies will be directed to this mailbox.</small>
                </label>
                <label className="hub-settings-field hub-settings-full">
                  <span>Email signature</span>
                  <textarea name="signature" rows={6} defaultValue={signature} maxLength={2000} />
                </label>
              </div>

              <div className="hub-settings-actions">
                <button className="hub-send-button" type="submit">Save email settings</button>
              </div>
            </section>
          </form>

          <div className="hub-settings-v2-two-column">
            <section className="hub-settings-card">
              <div className="hub-settings-heading">
                <div className="hub-settings-icon"><Server size={19} /></div>
                <div><h2>Mail delivery</h2><p>Current outbound and inbound mail configuration.</p></div>
              </div>
              <div className="hub-settings-v2-facts">
                <div><span>Outbound</span><strong>Google Workspace SMTP relay</strong></div>
                <div><span>Sender</span><strong>{senderEmail}</strong></div>
                <div><span>Gmail sync</span><strong className={gmailConnected ? "is-good" : "is-bad"}>{gmailConnected ? "Connected" : "Not connected"}</strong></div>
                <div><span>Inbound watch</span><strong className={gmailWatchActive ? "is-good" : "is-bad"}>{gmailWatchActive ? "Active" : "Inactive"}</strong></div>
              </div>
              <form action="/api/hub/email-test" method="post">
                <button type="submit" className="hub-secondary-button"><Send size={14} />Send test email</button>
              </form>
            </section>

            <section className="hub-settings-card">
              <div className="hub-settings-heading">
                <div className="hub-settings-icon"><ShieldCheck size={19} /></div>
                <div><h2>Domain authentication</h2><p>DNS checks that influence deliverability.</p></div>
              </div>
              <div className="hub-settings-v2-health-list">
                {emailHealth && [
                  ["SPF", emailHealth.spf],
                  ["DKIM", emailHealth.dkim],
                  ["DMARC", emailHealth.dmarc],
                ].map(([label, item]) => {
                  const health = item as { ok: boolean; detail: string };
                  return (
                    <div key={String(label)} className={health.ok ? "is-good" : "is-bad"}>
                      {health.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <div><strong>{String(label)}</strong><span>{health.detail}</span></div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <section className="hub-settings-v2-template-layout">
          <aside className="hub-settings-v2-template-list">
            <div className="hub-settings-v2-template-list-head">
              <span>EMAIL TEMPLATES</span>
              <strong>{templates.length} system templates</strong>
            </div>
            {templates.map((template) => (
              <Link
                key={template.key}
                href={`/hub/settings?tab=templates&template=${template.key}`}
                className={selectedTemplate?.key === template.key ? "hub-settings-v2-template-item is-active" : "hub-settings-v2-template-item"}
              >
                <strong>{template.name}</strong>
                <span>{template.description}</span>
                <small className={template.active ? "is-good" : undefined}>{template.active ? "Active" : "Disabled"}</small>
              </Link>
            ))}
          </aside>

          {selectedTemplate && (
            <TemplateEditor
              key={selectedTemplate.key}
              template={selectedTemplate}
              variables={selectedTemplate.variables}
              sampleValues={EMAIL_TEMPLATE_SAMPLE_VALUES}
            />
          )}
        </section>
      )}

      {activeTab === "integrations" && (
        <div className="hub-settings-v2-integrations-page">
          <div className="hub-settings-v2-integrations-head">
            <div>
              <span className="hub-settings-v2-kicker">CONNECTED SERVICES</span>
              <h2>Integrations</h2>
              <p>Manage the external services used by Staark Hub. Secrets stay in server environment variables.</p>
            </div>
          </div>

          <section className="hub-settings-v2-integration-grid">
            <article className="hub-settings-v2-integration-card">
              <div className="hub-settings-v2-integration-card-head">
                <span className="hub-settings-v2-integration-icon"><Mail size={19} /></span>
                <div>
                  <strong>Google Workspace</strong>
                  <span>Mailbox sync, inbound watch and SMTP relay.</span>
                </div>
                <span className={gmailConnected ? "hub-settings-v2-status is-connected" : "hub-settings-v2-status is-offline"}>
                  {gmailConnected ? "Connected" : "Not connected"}
                </span>
              </div>

              <div className="hub-settings-v2-integration-facts">
                <div><span>Mailbox</span><strong>{process.env.GOOGLE_GMAIL_ACCOUNT ?? replyToEmail}</strong></div>
                <div><span>Inbound watch</span><strong className={gmailWatchActive ? "is-good" : "is-bad"}>{gmailWatchActive ? "Active" : "Inactive"}</strong></div>
                <div><span>Watch expires</span><strong>{formatDateTime(settings?.gmailWatchExpiresAt)}</strong></div>
                <div><span>Outbound</span><strong>Google SMTP relay</strong></div>
              </div>

              <div className="hub-settings-v2-integration-actions-row">
                <a href="/api/google/gmail/connect" className="hub-secondary-button">
                  <RefreshCw size={14} />
                  {gmailConnected ? "Reconnect" : "Connect"}
                </a>
                {gmailConnected && <GmailWatchButton />}
              </div>
            </article>

            <article className="hub-settings-v2-integration-card">
              <div className="hub-settings-v2-integration-card-head">
                <span className="hub-settings-v2-integration-icon"><BarChart3 size={19} /></span>
                <div>
                  <strong>Google Analytics</strong>
                  <span>Traffic and website performance data.</span>
                </div>
                <span className={analyticsConnected ? "hub-settings-v2-status is-connected" : "hub-settings-v2-status is-offline"}>
                  {analyticsConnected ? "Connected" : "Not connected"}
                </span>
              </div>

              <div className="hub-settings-v2-integration-facts">
                <div><span>Access</span><strong>Read only</strong></div>
                <div><span>Connected</span><strong>{formatDateTime(settings?.ga4ConnectedAt)}</strong></div>
              </div>

              <div className="hub-settings-v2-integration-actions-row">
                <a href="/api/hub/google/connect" className="hub-secondary-button">
                  <RefreshCw size={14} />
                  {analyticsConnected ? "Reconnect Google" : "Connect Google"}
                </a>
              </div>
            </article>

            <article className="hub-settings-v2-integration-card">
              <div className="hub-settings-v2-integration-card-head">
                <span className="hub-settings-v2-integration-icon"><Search size={19} /></span>
                <div>
                  <strong>Google Search Console</strong>
                  <span>Search visibility and ranking data.</span>
                </div>
                <span className={analyticsConnected ? "hub-settings-v2-status is-connected" : "hub-settings-v2-status is-offline"}>
                  {analyticsConnected ? "Connected" : "Not connected"}
                </span>
              </div>

              <div className="hub-settings-v2-integration-facts">
                <div><span>Access</span><strong>Read only</strong></div>
                <div><span>OAuth</span><strong>Shared Google connection</strong></div>
              </div>

              <div className="hub-settings-v2-integration-actions-row">
                <a href="/api/hub/google/connect" className="hub-secondary-button">
                  <RefreshCw size={14} />
                  {analyticsConnected ? "Reconnect Google" : "Connect Google"}
                </a>
              </div>
            </article>

            <article className="hub-settings-v2-integration-card">
              <div className="hub-settings-v2-integration-card-head">
                <span className="hub-settings-v2-integration-icon"><GitMerge size={19} /></span>
                <div>
                  <strong>GitHub</strong>
                  <span>Repository, branch and deployment visibility.</span>
                </div>
                <span className={githubResult.connected ? "hub-settings-v2-status is-connected" : "hub-settings-v2-status is-offline"}>
                  {githubResult.connected ? "Connected" : "Unavailable"}
                </span>
              </div>

              <div className="hub-settings-v2-integration-facts">
                <div><span>Repository</span><strong>{githubResult.data?.repository.fullName ?? "Not available"}</strong></div>
                <div><span>Branch</span><strong>{githubResult.data?.branch.name ?? "Not available"}</strong></div>
                <div><span>Latest commit</span><strong>{githubResult.data?.commit.shortSha ?? "Not available"}</strong></div>
                <div><span>Workflow</span><strong>{githubResult.data?.workflow?.conclusion ?? githubResult.data?.workflow?.status ?? "No recent run"}</strong></div>
              </div>
            </article>

            <article className="hub-settings-v2-integration-card hub-settings-v2-integration-card-stripe">
              <div className="hub-settings-v2-integration-card-head">
                <span className="hub-settings-v2-integration-icon"><CreditCard size={19} /></span>
                <div>
                  <strong>Stripe</strong>
                  <span>Payments, invoices and future Billing sync.</span>
                </div>
                <span className={stripeStatus.configured ? "hub-settings-v2-status is-connected" : "hub-settings-v2-status is-offline"}>
                  {stripeStatus.configured ? "Configured" : "Not configured"}
                </span>
              </div>

              <div className="hub-settings-v2-integration-facts">
                <div><span>Mode</span><strong>{stripeStatus.mode === "unknown" ? "Not available" : stripeStatus.mode === "live" ? "Live" : "Test"}</strong></div>
                <div><span>Secret key</span><strong className={stripeStatus.secretConfigured ? "is-good" : "is-bad"}>{stripeStatus.secretConfigured ? "Configured" : "Missing"}</strong></div>
                <div><span>Webhook secret</span><strong className={stripeStatus.webhookConfigured ? "is-good" : "is-bad"}>{stripeStatus.webhookConfigured ? "Configured" : "Missing"}</strong></div>
                <div><span>Currency</span><strong>SEK</strong></div>
              </div>

              <div className="hub-settings-v2-integration-actions-row">
                {stripeStatus.configured ? (
                  <StripeTestButton />
                ) : (
                  <span className="hub-settings-v2-integration-hint">
                    Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to the server environment.
                  </span>
                )}
              </div>
            </article>
          </section>
        </div>
      )}
    </div>
  );
}
