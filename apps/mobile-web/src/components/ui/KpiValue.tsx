import React from "react";
import { cn } from "../../lib/cn";

type KpiValueProps = {
  value: string | number;
  label?: string;
  color?: "navy" | "gold" | "success" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const colorMap = {
  navy: "#1B2B5E",
  gold: "#F5A623",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",
};

const sizeMap = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-4xl",
};

export const KpiValue: React.FC<KpiValueProps> = ({
  value,
  label,
  color = "navy",
  size = "md",
  className,
}) => (
  <div className={cn("flex flex-col gap-0.5", className)}>
    {label && (
      <p
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: "#8A9AB8" }}
      >
        {label}
      </p>
    )}
    <span
      className={cn(
        "font-extrabold leading-none motion-number-reveal",
        sizeMap[size],
      )}
      style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        color: colorMap[color],
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
  </div>
);
