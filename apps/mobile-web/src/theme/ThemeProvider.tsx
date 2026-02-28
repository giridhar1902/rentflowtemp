import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getThemeCssVariables,
  institutionalTheme,
  resolveThemeMode,
  THEME_STORAGE_KEY,
  type ThemeMode,
  type ThemePreference,
} from "./theme";

type ThemeContextValue = {
  preference: ThemePreference;
  mode: ThemeMode;
  systemMode: ThemeMode;
  setPreference: (next: ThemePreference) => void;
  setMode: (next: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isValidPreference = (value: string | null): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

const getSystemMode = (): ThemeMode => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return institutionalTheme.modeDefaults.fallback;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getStoredPreference = (): ThemePreference => {
  if (typeof window === "undefined") {
    return institutionalTheme.modeDefaults.preference;
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidPreference(stored)) {
      return stored;
    }
  } catch {
    return institutionalTheme.modeDefaults.preference;
  }

  return institutionalTheme.modeDefaults.preference;
};

const applyThemeToDom = (mode: ThemeMode) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const cssVariables = getThemeCssVariables(mode);

  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  root.classList.toggle("dark", mode === "dark");

  for (const [key, value] of Object.entries(cssVariables)) {
    root.style.setProperty(key, value);
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [preference, setPreference] =
    useState<ThemePreference>(getStoredPreference);
  const [systemMode, setSystemMode] = useState<ThemeMode>(getSystemMode);

  const mode = useMemo(
    () => resolveThemeMode(preference, systemMode),
    [preference, systemMode],
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemMode(event.matches ? "dark" : "light");
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // no-op; preference fallback remains in-memory
    }
  }, [preference]);

  useEffect(() => {
    applyThemeToDom(mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      mode,
      systemMode,
      setPreference,
      setMode: (nextMode) => setPreference(nextMode),
      toggleMode: () =>
        setPreference((current) => {
          const currentMode = resolveThemeMode(current, systemMode);
          return currentMode === "dark" ? "light" : "dark";
        }),
    }),
    [mode, preference, systemMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
