import type { ComponentPropsWithoutRef } from "react";

import { classNames } from "./class-names";
import styles from "./Card.module.css";

export type CardProps =
  ComponentPropsWithoutRef<"article"> & {
    variant?: "default" | "muted";
    padding?: "none" | "sm" | "md" | "lg";
  };

export function Card({
  variant = "default",
  padding = "md",
  className,
  ...props
}: CardProps) {
  return (
    <article
      {...props}
      data-sw-ui=""
      className={classNames(
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        className,
      )}
    />
  );
}
