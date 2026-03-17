import React from "react";
import { useTheme } from "../../theme/ThemeProvider";
import type { ThemePreference } from "../../theme/theme";

const options: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "light_mode" },
  { value: "dark", label: "Dark", icon: "dark_mode" },
  { value: "system", label: "System", icon: "contrast" },
];

export const ThemeModeToggle: React.FC = () => {
  const { preference, setPreference } = useTheme();

  return (
    <div
      className="inline-flex rounded-xl p-1 gap-0.5"
      style={{ background: "#F8F9FA", border: "1px solid rgba(27,43,94,0.09)" }}
    >
      {options.map(({ value, label, icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={
              active
                ? {
                    background: "#1B2B5E",
                    color: "#FFFFFF",
                    boxShadow: "0 2px 8px rgba(27,43,94,0.2)",
                  }
                : { background: "transparent", color: "#8A9AB8" }
            }
          >
            <span className="material-symbols-outlined text-[14px]">
              {icon}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
};
