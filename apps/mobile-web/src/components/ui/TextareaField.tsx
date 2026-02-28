import React from "react";
import { cn } from "../../lib/cn";

type TextareaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  containerClassName?: string;
};

export const TextareaField = React.forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
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
      ...props
    },
    ref,
  ) => {
    const fallbackId = React.useId();
    const textareaId = id ?? fallbackId;

    return (
      <div className={cn("flex flex-col gap-2", containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
            {required ? " *" : null}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          required={required}
          className={cn(
            "min-h-[6rem] rounded-[var(--radius-control)] border border-border-subtle bg-surface px-3 py-2.5 text-sm text-text-primary",
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

TextareaField.displayName = "TextareaField";
