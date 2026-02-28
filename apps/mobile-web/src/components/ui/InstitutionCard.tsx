import React from "react";
import type { ElevationLevel } from "../../theme/theme";
import { cn } from "../../lib/cn";

type InstitutionCardProps = React.HTMLAttributes<HTMLDivElement> & {
  accentSpine?: boolean;
  elevation?: ElevationLevel;
  interactive?: boolean;
};

const elevationClasses: Record<ElevationLevel, string> = {
  base: "shadow-base",
  raised: "shadow-raised",
  floating: "shadow-floating",
  overlay: "shadow-overlay",
};

export const InstitutionCard = React.forwardRef<
  HTMLDivElement,
  InstitutionCardProps
>(
  (
    {
      accentSpine = false,
      elevation = "base",
      interactive = false,
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface p-[var(--space-card-padding)]",
        elevationClasses[elevation],
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:[box-shadow:var(--card-inner-stroke)] before:content-['']",
        interactive && "motion-card-hover",
        className,
      )}
      {...props}
    >
      {accentSpine && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[var(--card-accent-spine-width)] bg-[var(--color-card-accent-spine)]"
        />
      )}
      {children}
    </div>
  ),
);

InstitutionCard.displayName = "InstitutionCard";
