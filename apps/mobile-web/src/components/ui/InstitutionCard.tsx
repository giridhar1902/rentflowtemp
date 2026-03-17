import React from "react";
import { cn } from "../../lib/cn";

type InstitutionCardProps = {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  hover?: boolean;
  style?: React.CSSProperties;
};

export const InstitutionCard: React.FC<InstitutionCardProps> = ({
  children,
  className,
  accent = true,
  hover = false,
  style,
}) => (
  <div
    className={cn(
      "relative rounded-2xl overflow-hidden",
      hover && "transition-transform duration-200 hover:-translate-y-0.5",
      className,
    )}
    style={{
      background: "#FFFFFF",
      border: "1px solid rgba(27,43,94,0.08)",
      boxShadow: "0 2px 12px rgba(27,43,94,0.06)",
      padding: "var(--space-card-padding, 1.5rem)",
      ...style,
    }}
  >
    {/* Gold accent spine on left edge */}
    {accent && (
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl"
        style={{ background: "#F5A623" }}
      />
    )}
    {children}
  </div>
);
