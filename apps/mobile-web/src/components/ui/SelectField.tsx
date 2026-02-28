import React from "react";
import { cn } from "../../lib/cn";

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  containerClassName?: string;
};

export const SelectField = React.forwardRef<
  HTMLSelectElement,
  SelectFieldProps
>(
  (
    {
      label,
      hint,
      error,
      containerClassName,
      className,
      id,
      required,
      children,
      ...props
    },
    ref,
  ) => {
    const fallbackId = React.useId();
    const selectId = id ?? fallbackId;

    return (
      <div className={cn("flex flex-col gap-2", containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
            {required ? " *" : null}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          required={required}
          className={cn(
            "h-11 rounded-[var(--radius-control)] border border-border-subtle bg-surface px-3 text-sm text-text-primary",
            error && "border-danger",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p className="text-xs font-medium text-danger">{error}</p>
        ) : hint ? (
          <p className="text-xs text-text-secondary">{hint}</p>
        ) : null}
      </div>
    );
  },
);

SelectField.displayName = "SelectField";
