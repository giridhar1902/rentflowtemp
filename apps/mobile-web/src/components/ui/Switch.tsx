import React from "react";
import { cn } from "../../lib/cn";

type SwitchProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void; // backward-compat alias
  label?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  onCheckedChange,
  label,
  disabled,
  className,
  "aria-label": ariaLabel,
}) => {
  const handleChange = (v: boolean) => {
    onChange?.(v);
    onCheckedChange?.(v);
  };

  return (
    <label
      className={cn(
        "flex items-center gap-3 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div
        className="relative w-11 h-6 rounded-full transition-colors duration-200"
        style={{ background: checked ? "#F5A623" : "rgba(27,43,94,0.15)" }}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.checked)}
        />
        <span
          className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </div>
      {label && (
        <span className="text-sm font-semibold" style={{ color: "#1B2B5E" }}>
          {label}
        </span>
      )}
    </label>
  );
};
