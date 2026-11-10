import type { ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./EmptyState.module.css";

export type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div data-sw-ui="" className={classNames(styles.empty, className)}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <div className={styles.body}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
