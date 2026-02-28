import React from "react";
import { useTheme } from "../../theme/ThemeProvider";
import type { ThemePreference } from "../../theme/theme";
import { cn } from "../../lib/cn";

type ModeOption = {
  value: ThemePreference;
  label: string;
  icon: string;
};

const modeOptions: ModeOption[] = [
  { value: "system", label: "System", icon: "devices" },
  { value: "light", label: "Light", icon: "light_mode" },
  { value: "dark", label: "Dark", icon: "dark_mode" },
];

export const ThemeModeToggle: React.FC = () => {
  const { preference, setPreference } = useTheme();

  return (
    <div className="surface-subtle inline-flex items-center gap-1 rounded-[var(--radius-pill)] p-1 shadow-base">
      {modeOptions.map((option) => {
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            aria-label={option.label}
            title={option.label}
            className={cn(
              "motion-press inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-pill)]",
              "transition-colors duration-[var(--motion-standard)] ease-[var(--motion-easing)]",
              active
                ? "bg-surface text-primary shadow-base"
                : "text-text-secondary hover:bg-surface",
            )}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              {option.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
};
