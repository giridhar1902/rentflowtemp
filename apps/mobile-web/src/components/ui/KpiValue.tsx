import React from "react";
import { cn } from "../../lib/cn";

type KpiValueProps = {
  value: React.ReactNode;
  label?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  metaClassName?: string;
};

export const KpiValue: React.FC<KpiValueProps> = ({
  value,
  label,
  meta,
  className,
  valueClassName,
  labelClassName,
  metaClassName,
}) => (
  <div className={cn("flex flex-col gap-1", className)}>
    {label && (
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-[0.06em] text-text-secondary",
          labelClassName,
        )}
      >
        {label}
      </p>
    )}
    <p className={cn("kpi-value", valueClassName)}>{value}</p>
    {meta && (
      <p className={cn("text-sm text-text-secondary", metaClassName)}>{meta}</p>
    )}
  </div>
);
