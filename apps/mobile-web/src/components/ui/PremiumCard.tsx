import React from "react";
import { cn } from "../../lib/cn";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "gold" | "navy" | "glass" | "gradient" | "solid";
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  variant = "default",
  className,
  ...props
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "#FFFFFF",
      border: "1px solid rgba(27,43,94,0.08)",
      boxShadow: "0 2px 12px rgba(27,43,94,0.06)",
    },
    gold: {
      background: "#FFFFFF",
      border: "1.5px solid rgba(245,166,35,0.3)",
      boxShadow: "0 4px 20px rgba(245,166,35,0.12)",
      borderLeft: "3px solid #F5A623",
    },
    navy: {
      background: "linear-gradient(135deg, #1B2B5E 0%, #2D4A9E 100%)",
      border: "none",
      boxShadow: "0 4px 20px rgba(27,43,94,0.25)",
      color: "#FFFFFF",
    },
    // legacy aliases kept for backward compat
    glass: {
      background: "#FFFFFF",
      border: "1px solid rgba(27,43,94,0.08)",
      boxShadow: "0 2px 12px rgba(27,43,94,0.06)",
    },
    gradient: {
      background: "linear-gradient(135deg, #EEF1F8 0%, #F8F9FA 100%)",
      border: "1px solid rgba(27,43,94,0.08)",
      boxShadow: "0 2px 12px rgba(27,43,94,0.04)",
    },
    solid: {
      background: "#FFFFFF",
      border: "1px solid rgba(27,43,94,0.08)",
      boxShadow: "0 1px 4px rgba(27,43,94,0.04)",
    },
  };

  return (
    <div
      className={cn("rounded-2xl p-6", className)}
      style={variantStyles[variant] ?? variantStyles.default}
      {...props}
    >
      {children}
    </div>
  );
};
