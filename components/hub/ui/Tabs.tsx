import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./Tabs.module.css";

export type TabItem = {
  key: string;
  label: string;
  href: ComponentPropsWithoutRef<typeof Link>["href"];
  count?: number;
  icon?: ReactNode;
};

export type TabsProps = {
  label: string;
  tabs: readonly TabItem[];
  activeKey: string;
  trailing?: ReactNode;
  className?: string;
};

export function Tabs({
  label,
  tabs,
  activeKey,
  trailing,
  className,
}: TabsProps) {
  return (
    <nav
      data-sw-ui=""
      className={classNames(styles.tabs, className)}
      aria-label={label}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={classNames(styles.tab, active && styles.active)}
            aria-current={active ? "page" : undefined}
          >
            {tab.icon && <span className={styles.icon} aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <strong className={styles.count}>{tab.count}</strong>
            )}
          </Link>
        );
      })}
      {trailing && <div className={styles.trailing}>{trailing}</div>}
    </nav>
  );
}
