import React from "react";
import { cn } from "../../lib/cn";

type TextareaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const TextareaField = React.forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
>(({ label, error, hint, className, id, ...props }, ref) => {
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
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-[14px] px-4 py-3 text-sm font-medium resize-none transition-all outline-none focus:ring-2",
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
          minHeight: 96,
        }}
        {...props}
      />
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
});
TextareaField.displayName = "TextareaField";
