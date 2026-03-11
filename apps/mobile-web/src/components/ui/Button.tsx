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
    "bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] text-white !rounded-[20px] shadow-[0_8px_20px_rgba(255,122,0,0.3)] border-none hover:shadow-[0_12px_25px_rgba(255,122,0,0.4)]",
  secondary:
    "bg-white/[0.35] backdrop-blur-[20px] text-[#1e293b] border border-white/40 shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:bg-white/50 !rounded-[20px]",
  subtle:
    "bg-white/40 text-[#1e293b] border border-white/40 shadow-none !rounded-[20px]",
  ghost:
    "bg-transparent text-[#475569] border border-transparent shadow-none !rounded-[20px]",
  danger:
    "bg-red-500 text-white border border-red-500 shadow-base !rounded-[20px]",
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
