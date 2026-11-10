"use client";

import {
  BellRing,
  CheckCircle2,
  CreditCard,
  GitBranch,
  Globe2,
  KeyRound,
  Mail,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
} from "@/components/hub/ui";

import { previewIntegrations } from "../preview-data";
import styles from "../preview.module.css";

const settingsTabs = [
  { id: "workspace", label: "Workspace", icon: SlidersHorizontal },
  { id: "integrations", label: "Integrations", icon: Globe2 },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;

type SettingsTab = (typeof settingsTabs)[number]["id"];

const integrationIcons = {
  stripe: CreditCard,
  gmail: Mail,
  wordpress: Globe2,
  github: GitBranch,
};

const notificationRows = [
  {
    id: "new-lead",
    title: "New lead assigned",
    description: "Notify me when a lead is assigned to my pipeline.",
    initial: true,
  },
  {
    id: "new-email",
    title: "New customer email",
    description: "Notify me when a customer replies in a shared thread.",
    initial: true,
  },
  {
    id: "offer-accepted",
    title: "Offer accepted",
    description: "Notify me when a client accepts an offer.",
    initial: true,
  },
  {
    id: "weekly-digest",
    title: "Weekly digest",
    description: "Send a Monday summary of pipeline and delivery movement.",
    initial: false,
  },
  {
    id: "billing-events",
    title: "Billing events",
    description: "Notify me about failed payments and subscription changes.",
    initial: false,
  },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.switch} ${checked ? styles.switchOn : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} aria-hidden="true" />
    </button>
  );
}

export function SettingsSection() {
  const [tab, setTab] = useState<SettingsTab>("workspace");
  const [integrations, setIntegrations] = useState(previewIntegrations);
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationRows.map((row) => [row.id, row.initial])),
  );
  const [notice, setNotice] = useState("");

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + direction + settingsTabs.length) % settingsTabs.length;
    setTab(settingsTabs[next].id);
    requestAnimationFrame(() => document.getElementById(`settings-tab-${settingsTabs[next].id}`)?.focus());
  }

  function updateIntegration(id: string, name: string) {
    setIntegrations((current) =>
      current.map((integration) =>
        integration.id === id
          ? { ...integration, status: "Connected", tone: "success" as const, action: "Manage" }
          : integration,
      ),
    );
    setNotice(`${name} preview state updated locally. No external connection was made.`);
  }

  return (
    <div className={styles.sectionStack}>
      <PageHeader
        className={styles.pageHeader}
        eyebrow="SYSTEM / SETTINGS"
        title="Settings"
        description="A category-first settings shell with grouped controls, integration health and a security surface prepared for MFA."
        action={
          <Button type="button" onClick={() => setNotice("Settings preview saved locally. No API request was made.")}>
            <Save size={16} aria-hidden="true" />
            Save settings
          </Button>
        }
      />

      {notice && (
        <div className={styles.successAlert} role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      <label className={styles.mobileSettingsNav}>
        <span className={styles.srOnly}>Settings category</span>
        <select value={tab} onChange={(event) => setTab(event.target.value as SettingsTab)}>
          {settingsTabs.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </label>

      <div className={styles.settingsLayout}>
        <Card padding="sm" className={styles.settingsNavCard}>
          <div className={styles.settingsNavHeading}>
            <Settings2 size={18} aria-hidden="true" />
            <span>Settings</span>
          </div>
          <div className={styles.settingsNav} role="tablist" aria-label="Settings sections" aria-orientation="vertical">
            {settingsTabs.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`settings-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  aria-controls={`settings-panel-${item.id}`}
                  tabIndex={tab === item.id ? 0 : -1}
                  className={`${styles.settingsNavButton} ${tab === item.id ? styles.settingsNavActive : ""}`}
                  onClick={() => setTab(item.id)}
                  onKeyDown={(event) => handleTabKey(event, index)}
                >
                  <Icon size={17} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className={styles.settingsSecurity}>
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Admin-only area</span>
          </div>
        </Card>

        <div className={styles.settingsBody}>
          <div
            id="settings-panel-workspace"
            role="tabpanel"
            aria-labelledby="settings-tab-workspace"
            hidden={tab !== "workspace"}
          >
            <Card padding="lg" className={styles.settingsPanel}>
              <div className={styles.panelHeaderCompact}>
                <div>
                  <span className={styles.eyebrow}>WORKSPACE</span>
                  <h2>Organization settings</h2>
                  <p>Grouped defaults for the Staark workspace.</p>
                </div>
                <StatusBadge tone="success">Healthy</StatusBadge>
              </div>

              <fieldset className={styles.settingsGroup}>
                <legend>Organization</legend>
                <div className={styles.settingsFieldGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Workspace name</span>
                    <input className={styles.input} defaultValue="Staark Inc." />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Region</span>
                    <select className={styles.select} defaultValue="eu-north">
                      <option value="eu-north">EU North</option>
                      <option value="eu-west">EU West</option>
                    </select>
                  </label>
                </div>
              </fieldset>

              <fieldset className={styles.settingsGroup}>
                <legend>Defaults</legend>
                <div className={styles.settingsFieldGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Timezone</span>
                    <select className={styles.select} defaultValue="stockholm">
                      <option value="stockholm">Europe / Stockholm</option>
                      <option value="london">Europe / London</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Week starts</span>
                    <select className={styles.select} defaultValue="monday">
                      <option value="monday">Monday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </label>
                </div>
              </fieldset>

              <div className={styles.inlineNotice}>
                <ShieldCheck size={17} aria-hidden="true" />
                Preview settings are isolated from the real Hub configuration.
              </div>
            </Card>
          </div>

          <div
            id="settings-panel-integrations"
            role="tabpanel"
            aria-labelledby="settings-tab-integrations"
            hidden={tab !== "integrations"}
          >
            <Card padding="none" className={styles.settingsPanel}>
              <div className={styles.panelHeaderCompact}>
                <div>
                  <span className={styles.eyebrow}>INTEGRATIONS</span>
                  <h2>Connected services</h2>
                  <p>Operational status for the tools behind the workspace.</p>
                </div>
                <StatusBadge tone="info">Read-only preview</StatusBadge>
              </div>
              <div className={styles.integrationList}>
                {integrations.map((integration) => {
                  const Icon = integrationIcons[integration.id as keyof typeof integrationIcons];
                  return (
                    <div className={styles.integrationRow} key={integration.id}>
                      <span className={styles.integrationIcon}><Icon size={19} aria-hidden="true" /></span>
                      <div className={styles.integrationCopy}>
                        <strong>{integration.name}</strong>
                        <p>{integration.description}</p>
                      </div>
                      <StatusBadge tone={integration.tone}>{integration.status}</StatusBadge>
                      <Button
                        type="button"
                        size="sm"
                        variant={integration.status === "Connected" ? "ghost" : "secondary"}
                        onClick={() => updateIntegration(integration.id, integration.name)}
                      >
                        {integration.action}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div
            id="settings-panel-notifications"
            role="tabpanel"
            aria-labelledby="settings-tab-notifications"
            hidden={tab !== "notifications"}
          >
            <Card padding="lg" className={styles.settingsPanel}>
              <div className={styles.panelHeaderCompact}>
                <div>
                  <span className={styles.eyebrow}>NOTIFICATIONS</span>
                  <h2>Notification preferences</h2>
                  <p>Every switch is local and keyboard operable.</p>
                </div>
                <StatusBadge tone="info">Local only</StatusBadge>
              </div>
              <div className={styles.toggleList}>
                {notificationRows.map((row) => (
                  <div className={styles.toggleRow} key={row.id}>
                    <div className={styles.toggleCopy}>
                      <strong>{row.title}</strong>
                      <p>{row.description}</p>
                    </div>
                    <Toggle
                      checked={Boolean(toggles[row.id])}
                      onChange={(checked) => setToggles((current) => ({ ...current, [row.id]: checked }))}
                      label={row.title}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div
            id="settings-panel-security"
            role="tabpanel"
            aria-labelledby="settings-tab-security"
            hidden={tab !== "security"}
          >
            <div className={styles.securityStack}>
              <Card padding="lg" className={styles.settingsPanel}>
                <div className={styles.securityHero}>
                  <span className={styles.securityIcon}><ShieldCheck size={22} aria-hidden="true" /></span>
                  <div>
                    <span className={styles.eyebrow}>MULTI-FACTOR AUTHENTICATION</span>
                    <h2>TOTP authenticator enabled</h2>
                    <p>Production MFA uses encrypted secrets, hashed recovery codes and a partial-auth challenge.</p>
                  </div>
                  <span className={styles.signalBadge}><span aria-hidden="true" /> Enabled</span>
                </div>
                <dl className={styles.securityFacts}>
                  <div><dt>Method</dt><dd>TOTP · 30-second window</dd></div>
                  <div><dt>Recovery codes</dt><dd>8 remaining</dd></div>
                  <div><dt>Last verified</dt><dd>12 Nov 2026, 09:41</dd></div>
                </dl>
                <div className={styles.securityActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setNotice("Recovery codes are preview-only and never generated in this route.")}
                  >
                    View recovery codes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotice("MFA management is preview-only. No auth flow was changed.")}
                  >
                    Manage MFA
                  </Button>
                </div>
              </Card>

              <Card padding="lg" className={styles.settingsPanel}>
                <div className={styles.panelHeaderCompact}>
                  <div>
                    <span className={styles.eyebrow}>ACCOUNT SECURITY</span>
                    <h2>Password and sessions</h2>
                  </div>
                  <StatusBadge tone="success">Protected</StatusBadge>
                </div>
                <div className={styles.securityRows}>
                  <div className={styles.securityRow}>
                    <span className={styles.securityRowIcon}><KeyRound size={17} aria-hidden="true" /></span>
                    <div><strong>Password</strong><p>Last changed 42 days ago</p></div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setNotice("Password change is preview-only.")}
                    >
                      Change
                    </Button>
                  </div>
                  <div className={styles.securityRow}>
                    <span className={styles.securityRowIcon}><Smartphone size={17} aria-hidden="true" /></span>
                    <div><strong>Active sessions</strong><p>2 devices · current session is Chrome</p></div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setNotice("Session management is preview-only.")}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <p className={styles.dataNote}>
        Settings, toggles and security states are local preview state only. No auth or API behavior is connected.
      </p>
    </div>
  );
}
