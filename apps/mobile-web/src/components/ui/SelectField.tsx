import React from "react";
import { cn } from "../../lib/cn";

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
};

export const SelectField = React.forwardRef<
  HTMLSelectElement,
  SelectFieldProps
>(
  (
    { label, error, hint, placeholder, className, id, children, ...props },
    ref,
  ) => {
    const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, "-")}`;
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold"
            style={{ color: "#1B2B5E" }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-11 rounded-[14px] px-4 pr-9 text-sm font-medium appearance-none transition-all outline-none focus:ring-2",
              error
                ? "focus:ring-red-200"
                : "focus:ring-[rgba(245,166,35,0.25)]",
              className,
            )}
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              color: "#1B2B5E",
              background: "#F8F9FA",
              border: error
                ? "1.5px solid #DC2626"
                : "1.5px solid rgba(27,43,94,0.12)",
            }}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {children}
          </select>
          <span
            className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none"
            style={{ color: "#8A9AB8" }}
          >
            expand_more
          </span>
        </div>
        {hint && !error && (
          <p className="text-xs" style={{ color: "#8A9AB8" }}>
            {hint}
          </p>
        )}
        {error && (
          <p className="text-xs font-medium" style={{ color: "#DC2626" }}>
            {error}
          </p>
        )}
      </div>
    );
  },
);
SelectField.displayName = "SelectField";
