import type { ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./Metrics.module.css";

export type MetricsProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function Metrics({ label, children, className }: MetricsProps) {
  return (
    <section
      data-sw-ui=""
      className={classNames(styles.metrics, className)}
      aria-label={label}
    >
      {children}
    </section>
  );
}

export type MetricProps = {
  label: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
  className?: string;
};

export function Metric({
  label,
  value,
  description,
  icon,
  className,
}: MetricProps) {
  return (
    <div data-sw-ui="" className={classNames(styles.metric, className)}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <div className={styles.body}>
        <span className={styles.label}>{label}</span>
        <strong className={styles.value}>{value}</strong>
        {description && <span className={styles.description}>{description}</span>}
      </div>
    </div>
  );
}
