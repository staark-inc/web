import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { classNames } from "./class-names";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

type ActionAppearance = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

export type ButtonProps =
  ComponentPropsWithoutRef<"button"> &
  ActionAppearance;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      block = false,
      className,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        data-sw-ui=""
        className={classNames(
          styles.button,
          styles[variant],
          styles[size],
          block && styles.block,
          className,
        )}
      />
    );
  },
);

export type ActionLinkProps =
  Omit<ComponentPropsWithoutRef<typeof Link>, "className"> &
  ActionAppearance & {
    className?: string;
  };

export function ActionLink({
  variant = "primary",
  size = "md",
  block = false,
  className,
  ...props
}: ActionLinkProps) {
  return (
    <Link
      {...props}
      data-sw-ui=""
      className={classNames(
        styles.button,
        styles[variant],
        styles[size],
        block && styles.block,
        className,
      )}
    />
  );
}
