import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Domvio brand
        navy: "#1B2B5E",
        "navy-light": "#2D4A9E",
        gold: "#F5A623",
        "gold-dark": "#E8920F",

        // Semantic aliases → CSS vars
        primary: "var(--color-accent)",
        "primary-dark": "var(--color-accent-strong)",
        accent: "var(--color-accent)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-subtle": "var(--color-surface-subtle)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "border-subtle": "var(--color-border-subtle)",
        brass: "var(--color-accent)", // legacy alias
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
        inter: ['"Plus Jakarta Sans"', "sans-serif"], // legacy alias
        public: ['"Plus Jakarta Sans"', "sans-serif"], // legacy alias
        numeric: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        base: "var(--elevation-base)",
        raised: "var(--elevation-raised)",
        floating: "var(--elevation-floating)",
        overlay: "var(--elevation-overlay)",
        gold: "0 4px 16px rgba(245,166,35,0.35)",
        navy: "0 4px 16px rgba(27,43,94,0.14)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
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
