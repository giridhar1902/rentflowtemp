import React from "react";
import { cn } from "../../lib/cn";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    { label, error, hint, leadingIcon, trailingIcon, className, id, ...props },
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
        <div className="relative flex items-center">
          {leadingIcon && (
            <span
              className="absolute left-3 flex items-center"
              style={{ color: "#8A9AB8" }}
            >
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-11 rounded-[14px] text-sm font-medium transition-all outline-none",
              "focus:ring-2",
              leadingIcon ? "pl-10 pr-4" : "px-4",
              trailingIcon ? "pr-10" : "",
              error
                ? "border-[#DC2626] focus:ring-red-200"
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
          />
          {trailingIcon && (
            <span
              className="absolute right-3 flex items-center"
              style={{ color: "#8A9AB8" }}
            >
              {trailingIcon}
            </span>
          )}
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
TextField.displayName = "TextField";
