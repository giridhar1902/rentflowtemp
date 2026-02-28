import React from "react";
import { cn } from "../../lib/cn";

type SwitchProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "type"
> & {
  checked: boolean;
  onCheckedChange: (nextChecked: boolean) => void;
};

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled, className, ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onCheckedChange(!checked);
        }
      }}
      className={cn(
        "motion-press relative inline-flex h-6 w-11 shrink-0 items-center rounded-[var(--radius-pill)] border border-border-subtle bg-surface-subtle",
        checked && "border-primary bg-primary",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-[2px] size-5 rounded-[var(--radius-pill)] bg-[var(--color-accent-contrast)] shadow-base [transition-duration:var(--motion-fast)] [transition-property:transform] [transition-timing-function:var(--motion-easing)]",
          checked && "translate-x-[20px]",
        )}
      />
    </button>
  ),
);

Switch.displayName = "Switch";
