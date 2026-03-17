import React from "react";
import { cn } from "../../lib/cn";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "gold"
  | "navy";

type BadgeProps = {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
};

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  success: {
    background: "#DCFCE7",
    color: "#15803D",
    border: "1px solid rgba(22,163,74,0.2)",
  },
  warning: {
    background: "#FEF3C7",
    color: "#B45309",
    border: "1px solid rgba(217,119,6,0.2)",
  },
  danger: {
    background: "#FEE2E2",
    color: "#B91C1C",
    border: "1px solid rgba(220,38,38,0.2)",
  },
  info: {
    background: "#DBEAFE",
    color: "#1D4ED8",
    border: "1px solid rgba(37,99,235,0.2)",
  },
  neutral: {
    background: "#F1F5F9",
    color: "#475569",
    border: "1px solid rgba(71,85,105,0.15)",
  },
  gold: {
    background: "#FEF3C7",
    color: "#92400E",
    border: "1px solid rgba(245,166,35,0.3)",
  },
  navy: {
    background: "#EEF1F8",
    color: "#1B2B5E",
    border: "1px solid rgba(27,43,94,0.15)",
  },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  children,
  className,
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
      className,
    )}
    style={{
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      ...variantStyles[variant],
    }}
  >
    {children}
  </span>
);
