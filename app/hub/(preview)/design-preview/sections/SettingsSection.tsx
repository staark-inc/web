"use client";

import {
  BellRing,
  CheckCircle2,
  CreditCard,
  GitBranch,
  Globe2,
  Mail,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
} from "@/components/hub/ui";

import {
  previewIntegrations,
} from "../preview-data";
import styles from "../preview.module.css";

const settingsTabs = [
  { id: "workspace", label: "Workspace", icon: SlidersHorizontal },
  { id: "integrations", label: "Integrations", icon: Globe2 },
  { id: "notifications", label: "Notifications", icon: BellRing },
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
          ? {
              ...integration,
              status: "Connected",
              tone: "success",
              action: "Manage",
            }
          : integration,
      ),
    );
    setNotice(`${name} preview state updated locally. No external connection was made.`);
  }

  function saveSettings() {
    setNotice("Settings preview saved locally. No API request was made.");
  }

  return (
    <div className={styles.sectionStack}>
      <PageHeader
        className={styles.pageHeader}
        eyebrow="SYSTEM / SETTINGS"
        title="Settings"
        description="Navigation, integration health and notification controls share one compact settings shell."
        action={
          <Button type="button" onClick={saveSettings}>
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

      <div className={styles.settingsLayout}>
        <Card padding="sm" className={styles.settingsNavCard}>
          <div className={styles.settingsNavHeading}>
            <Settings2 size={18} aria-hidden="true" />
            <span>Settings</span>
          </div>
          <div className={styles.settingsNav} role="tablist" aria-label="Settings sections">
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
            <Card padding="lg">
              <div className={styles.panelHeaderCompact}>
                <div>
                  <span className={styles.eyebrow}>WORKSPACE</span>
                  <h2>Workspace identity</h2>
                  <p>Read-only mock values for the preview.</p>
                </div>
                <StatusBadge tone="success">Healthy</StatusBadge>
              </div>
              <dl className={styles.settingsRows}>
                <div><dt>Workspace</dt><dd>Staark Inc.</dd></div>
                <div><dt>Plan</dt><dd>Scale · annual</dd></div>
                <div><dt>Region</dt><dd>EU North</dd></div>
                <div><dt>Seats</dt><dd>8 of 12</dd></div>
                <div><dt>Data policy</dt><dd>No production data in this preview</dd></div>
              </dl>
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
            <div className={styles.integrationGrid}>
              {integrations.map((integration) => {
                const Icon = integrationIcons[integration.id as keyof typeof integrationIcons];
                return (
                  <Card key={integration.id} className={styles.integrationCard}>
                    <div className={styles.integrationHead}>
                      <span className={styles.integrationIcon}>
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <StatusBadge tone={integration.tone}>{integration.status}</StatusBadge>
                    </div>
                    <h2>{integration.name}</h2>
                    <p>{integration.description}</p>
                    <div className={styles.integrationFooter}>
                      <span>{integration.status === "Connected" ? "Connected in preview" : "Action required"}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant={integration.status === "Connected" ? "ghost" : "secondary"}
                        onClick={() => updateIntegration(integration.id, integration.name)}
                      >
                        {integration.action}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div
            id="settings-panel-notifications"
            role="tabpanel"
            aria-labelledby="settings-tab-notifications"
            hidden={tab !== "notifications"}
          >
            <Card padding="lg">
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
                      onChange={(checked) =>
                        setToggles((current) => ({ ...current, [row.id]: checked }))
                      }
                      label={row.title}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.inlineNotice}>
                <BellRing size={17} aria-hidden="true" />
                Changes are visual only and reset when the preview reloads.
              </div>
            </Card>
          </div>
        </div>
      </div>

      <p className={styles.dataNote}>
        Toggles, integration states and save confirmations are local preview state only.
      </p>
    </div>
  );
}
