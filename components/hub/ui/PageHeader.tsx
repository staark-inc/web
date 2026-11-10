import type { ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./PageHeader.module.css";

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  titleId?: string;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  titleId,
  className,
}: PageHeaderProps) {
  return (
    <header data-sw-ui="" className={classNames(styles.header, className)}>
      <div className={styles.heading}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1 id={titleId} className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.actions}>{action}</div>}
    </header>
  );
}
