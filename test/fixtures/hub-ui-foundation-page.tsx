// Copied into app/hub-ui-foundation only for UI-01 browser and visual checks.
// Never a production route and never imported by a production page.
import type { Metadata } from "next";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FolderKanban,
  Inbox,
  Plus,
  Search,
} from "lucide-react";

import HubLayout from "@/app/hub/layout";
import {
  ActionLink,
  Button,
  Card,
  EmptyState,
  Metric,
  Metrics,
  PageHeader,
  StatusBadge,
  Tabs,
} from "@/components/hub/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hub UI foundation",
  robots: { index: false, follow: false },
};

const href = "/hub-ui-foundation";

const panelTitle = {
  margin: "0 0 8px",
  color: "var(--sw-ink)",
  fontSize: "var(--sw-text-lg)",
  fontWeight: "var(--sw-weight-bold)",
  lineHeight: "var(--sw-line-snug)",
} as const;

const paragraph = {
  margin: 0,
  color: "var(--sw-muted)",
  fontSize: "var(--sw-text-base)",
  lineHeight: "var(--sw-line-normal)",
} as const;

export default function HubUiFoundationFixture() {
  return (
    <HubLayout>
      <div
        data-sw-ui=""
        style={{
          minHeight: "100vh",
          background: "var(--sw-bg)",
          padding: "24px 20px 48px",
        }}
      >
        <main
          style={{
            display: "grid",
            gap: "24px",
            width: "100%",
            maxWidth: "var(--sw-content-wide)",
            margin: "0 auto",
          }}
        >
          <PageHeader
            eyebrow="FOUNDATION / UI-01"
            title="Design system primitives"
            description="Canonical tokens, accessible primitives and CSS Module ownership. This fixture is test-only."
            action={
              <ActionLink href={href}>
                <Plus size={16} aria-hidden="true" />
                New record
              </ActionLink>
            }
          />

          <Metrics label="Foundation metrics">
            <Metric label="Primitives" value="8" description="Shared UI contracts" icon={<FolderKanban size={18} />} />
            <Metric label="Tokens" value="Canonical" description="One --sw-* vocabulary" icon={<CheckCircle2 size={18} />} />
            <Metric label="Modules" value="7" description="Scoped stylesheets" icon={<Search size={18} />} />
            <Metric label="Consumers" value="0" description="Pages migrate next" icon={<Inbox size={18} />} />
          </Metrics>

          <Tabs
            label="Foundation sections"
            activeKey="overview"
            tabs={[
              { key: "overview", label: "Overview", href, count: 8 },
              { key: "status", label: "Status", href, count: 5 },
              { key: "empty", label: "Empty", href },
              { key: "actions", label: "Actions", href },
            ]}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "16px",
            }}
          >
            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <h2 style={panelTitle}>Card surface</h2>
                <StatusBadge tone="info" icon={<Bell size={13} />}>Info</StatusBadge>
              </div>
              <p style={paragraph}>
                White surface, one border, one radius and a subtle elevation token.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
                <StatusBadge>Neutral</StatusBadge>
                <StatusBadge tone="success">Success</StatusBadge>
                <StatusBadge tone="warning">Warning</StatusBadge>
                <StatusBadge tone="danger">Danger</StatusBadge>
              </div>
            </Card>

            <Card variant="muted">
              <h2 style={panelTitle}>Action hierarchy</h2>
              <p style={paragraph}>
                One primary action per surface; secondary and ghost actions stay quieter.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                <Button size="sm">Small</Button>
                <Button size="sm" variant="secondary">
                  Small secondary
                </Button>
              </div>
            </Card>
          </div>

          <Card padding="lg">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={panelTitle}>Keyboard and responsive behavior</h2>
                <p style={paragraph}>
                  Every link and button has a visible focus ring. The tab strip scrolls at narrow widths.
                </p>
              </div>
              <ActionLink href={href} variant="secondary">
                Open details
                <ArrowRight size={16} aria-hidden="true" />
              </ActionLink>
            </div>
          </Card>

          <EmptyState
            title="Nothing here yet"
            description="The empty state is shared by first-use, filtered-empty and integration-empty variants."
            icon={<Inbox size={20} />}
            action={<Button variant="secondary">Connect data</Button>}
          />
        </main>
      </div>
    </HubLayout>
  );
}
