import React from "react";
import { cn } from "../../lib/cn";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  containerClassName?: string;
};

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      hint,
      error,
      containerClassName,
      className,
      id,
      required,
      ...props
    },
    ref,
  ) => {
    const fallbackId = React.useId();
    const inputId = id ?? fallbackId;

    return (
      <div className={cn("flex flex-col gap-2", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
            {required ? " *" : null}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          required={required}
          className={cn(
            "h-11 rounded-[var(--radius-control)] border border-border-subtle bg-surface px-3 text-sm text-text-primary",
            error && "border-danger",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-danger">{error}</p>
        ) : hint ? (
          <p className="text-xs text-text-secondary">{hint}</p>
        ) : null}
      </div>
    );
  },
);

TextField.displayName = "TextField";
