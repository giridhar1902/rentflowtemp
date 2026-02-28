import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-accent)",
        "primary-dark": "var(--color-accent-strong)",
        accent: "var(--color-accent)",
        "background-light": "var(--color-background)",
        "background-dark": "var(--color-background)",
        "success-green": "var(--color-success)",

        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-subtle": "var(--color-surface-subtle)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "border-subtle": "var(--color-border-subtle)",
        brass: "var(--color-accent)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
      },
      fontFamily: {
        display: ["var(--font-family-primary)"],
        inter: ["var(--font-family-primary)"],
        public: ["var(--font-family-primary)"],
        numeric: ["var(--font-family-numeric)"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        base: "var(--elevation-base)",
        raised: "var(--elevation-raised)",
        floating: "var(--elevation-floating)",
        overlay: "var(--elevation-overlay)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn var(--motion-standard) var(--motion-easing)",
        slideUp: "slideUp var(--motion-standard) var(--motion-easing)",
      },
    },
  },
  plugins: [],
} satisfies Config;
