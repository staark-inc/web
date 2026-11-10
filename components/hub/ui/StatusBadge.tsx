import type { ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./StatusBadge.module.css";

export type StatusTone =
  | "neutral"
  | "success"
  | "info"
  | "warning"
  | "danger";

export type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusTone;
  icon?: ReactNode;
  className?: string;
};

export function StatusBadge({
  children,
  tone = "neutral",
  icon,
  className,
}: StatusBadgeProps) {
  return (
    <span data-sw-ui="" className={classNames(styles.badge, styles[tone], className)}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
