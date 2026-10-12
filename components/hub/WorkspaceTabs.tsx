import Link from "next/link";
import type { ReactNode } from "react";

export type WorkspaceTab = {
  key: string;
  label: string;
  href: string;
  count?: number;
  icon?: ReactNode;
};

export function WorkspaceTabs({
  label,
  tabs,
  activeKey,
  trailing,
}: {
  label: string;
  tabs: readonly WorkspaceTab[];
  activeKey: string;
  trailing?: ReactNode;
}) {
  return (
    <nav className="sw-filter-tabs" aria-label={label}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={active ? "is-active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && <strong>{tab.count}</strong>}
          </Link>
        );
      })}
      {trailing}
    </nav>
  );
}
