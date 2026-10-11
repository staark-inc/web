import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

/**
 * Staark Workspace primitives.
 * Use sw-* classes from app/hub/theme.css. These are intentionally
 * presentation-only: fetching, navigation state and mutation stay in pages.
 */
export function WorkspacePage({ children }: { children: ReactNode }) {
  return <div className="hub-page sw-page">{children}</div>;
}

export function PageHeader({
  eyebrow, title, description, action,
}: {
  eyebrow?: string; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <header className="sw-page-header">
      <div className="sw-page-heading">
        {eyebrow && <span className="sw-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="sw-page-actions">{action}</div>}
    </header>
  );
}

export function Metrics({ children, label }: { children: ReactNode; label: string }) {
  return <section className="sw-metrics" aria-label={label}>{children}</section>;
}

export function Metric({
  label, value, description, icon,
}: {
  label: string; value: ReactNode; description?: string; icon?: ReactNode;
}) {
  return (
    <div className="sw-metric">
      {icon && <span className="sw-metric-icon" aria-hidden="true">{icon}</span>}
      <div className="sw-metric-body">
        <span className="sw-metric-label">{label}</span>
        <strong className="sw-metric-value">{value}</strong>
        {description && <span className="sw-metric-description">{description}</span>}
      </div>
    </div>
  );
}

export function SectionHeader({ title, description, action }: {
  title: string; description?: string; action?: ReactNode;
}) {
  return <div className="sw-section-header">
    <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
    {action}
  </div>;
}

export function RecordList({ label, children }: { label: string; children: ReactNode }) {
  return <section className="sw-record-list" aria-label={label}>{children}</section>;
}

export function RecordRow({
  href, initials, name, subtitle, details, meta,
}: {
  href: string; initials: string; name: string; subtitle?: ReactNode;
  details?: ReactNode; meta?: ReactNode;
}) {
  return <article className="sw-record">
    <div className="sw-record-person">
      <span className="sw-avatar" aria-hidden="true">{initials || "—"}</span>
      <div className="sw-record-identity">
        <Link href={href} className="sw-record-name">{name}</Link>
        {subtitle && <div className="sw-record-subtitle">{subtitle}</div>}
      </div>
    </div>
    {details && <div className="sw-record-details">{details}</div>}
    <div className="sw-record-end">
      {meta && <span className="sw-record-meta">{meta}</span>}
      <Link href={href} className="sw-record-open" aria-label={`Open ${name}`}>
        Open <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  </article>;
}

export function InfoChip({ children, tone = "neutral", icon }: {
  children: ReactNode; tone?: "neutral" | "success" | "info" | "warning"; icon?: ReactNode;
}) {
  return <span className={`sw-chip sw-chip-${tone}`}>{icon}{children}</span>;
}

export function EmptyState({ title, description, action }: {
  title: string; description: string; action?: ReactNode;
}) {
  return <div className="sw-empty">
    <h2>{title}</h2><p>{description}</p>{action}
  </div>;
}
