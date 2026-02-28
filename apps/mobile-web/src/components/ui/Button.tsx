import React from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "subtle" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-[var(--color-accent-contrast)] border border-primary shadow-base",
  secondary:
    "bg-surface text-text-primary border border-border-subtle shadow-base",
  subtle:
    "bg-surface-subtle text-text-primary border border-border-subtle shadow-none",
  ghost:
    "bg-transparent text-text-secondary border border-transparent shadow-none",
  danger: "bg-danger text-white border border-danger shadow-base",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leadingIcon,
      trailingIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = Boolean(disabled || loading);

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] font-semibold leading-none",
          "motion-press",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <span
            className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden
          />
        )}
        {!loading && leadingIcon}
        <span>{children}</span>
        {!loading && trailingIcon}
      </button>
    );
  },
);

Button.displayName = "Button";
