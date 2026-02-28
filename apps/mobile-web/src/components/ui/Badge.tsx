import React from "react";
import { cn } from "../../lib/cn";

type BadgeTone =
  | "default"
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  default: "bg-surface-subtle text-text-secondary border border-border-subtle",
  neutral: "bg-surface-subtle text-text-secondary border border-border-subtle",
  accent:
    "bg-primary text-[var(--color-accent-contrast)] border border-primary",
  success: "bg-success text-white border border-success",
  warning: "bg-warning text-white border border-warning",
  danger: "bg-danger text-white border border-danger",
  info: "bg-info text-white border border-info",
};

export const Badge: React.FC<BadgeProps> = ({
  tone = "default",
  className,
  children,
  ...props
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-semibold tracking-wide",
      toneClasses[tone],
      className,
    )}
    {...props}
  >
    {children}
  </span>
);
