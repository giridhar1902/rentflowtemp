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

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, #F5A623 0%, #E8920F 100%)",
    color: "#FFFFFF",
    border: "none",
    boxShadow: "0 4px 16px rgba(245,166,35,0.35)",
  },
  secondary: {
    background: "#FFFFFF",
    color: "#1B2B5E",
    border: "1.5px solid rgba(27,43,94,0.14)",
    boxShadow: "0 1px 4px rgba(27,43,94,0.06)",
  },
  subtle: {
    background: "#F8F9FA",
    color: "#1B2B5E",
    border: "1px solid rgba(27,43,94,0.09)",
    boxShadow: "none",
  },
  ghost: {
    background: "transparent",
    color: "#5A6A8A",
    border: "none",
    boxShadow: "none",
  },
  danger: {
    background: "#DC2626",
    color: "#FFFFFF",
    border: "none",
    boxShadow: "0 4px 12px rgba(220,38,38,0.25)",
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-11 px-4 text-sm rounded-[14px]",
  lg: "h-12 px-5 text-base rounded-[16px]",
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
      style,
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
          "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-bold leading-none transition-all duration-150 active:scale-[0.97]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size],
          className,
        )}
        style={{
          ...variantStyles[variant],
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          ...style,
        }}
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
