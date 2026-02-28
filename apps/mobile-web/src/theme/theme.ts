export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";
export type ElevationLevel = "base" | "raised" | "floating" | "overlay";

export const THEME_STORAGE_KEY = "proptech.theme.preference";

export type ThemeColorTokens = {
  background: string;
  surface: string;
  subtleSurface: string;
  textPrimary: string;
  textSecondary: string;
  borderSubtle: string;
  accent: string;
  accentStrong: string;
  accentContrast: string;
  focusRing: string;
  kpiHighlight: string;
  cardAccentSpine: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  overlayScrim: string;
};

export type ThemeShadows = Record<ElevationLevel, string>;

const lightAccent = "#8C6A2E";
const darkAccent = "#B58A3C";

export const institutionalTheme = {
  meta: {
    name: "Institutional Rental Fintech Theme",
    version: "1.0.0",
    updatedAt: "2026-02-27",
  },
  modeDefaults: {
    preference: "system" as ThemePreference,
    fallback: "light" as ThemeMode,
  },
  accent: {
    name: "Aged Brass",
    light: lightAccent,
    dark: darkAccent,
    usageRules: {
      allowed: [
        "active-navigation-indicator",
        "focus-ring",
        "kpi-highlight",
        "financial-card-accent-spine",
        "selected-state",
        "important-number-emphasis",
      ],
      forbidden: [
        "full-surface-backgrounds",
        "neon-or-glow-effects",
        "large-gradients",
        "decorative-overuse",
      ],
    },
  },
  color: {
    light: {
      background: "#F3EFE9",
      surface: "#FFFFFF",
      subtleSurface: "#F6F2EC",
      textPrimary: "#1E1E1C",
      textSecondary: "#5A5854",
      borderSubtle: "rgba(0,0,0,0.06)",
      accent: lightAccent,
      accentStrong: "#7A5C29",
      accentContrast: "#FFFFFF",
      focusRing: "rgba(140,106,46,0.45)",
      kpiHighlight: lightAccent,
      cardAccentSpine: lightAccent,
      success: "#2D7C51",
      warning: "#A06A17",
      danger: "#B64336",
      info: "#33606C",
      overlayScrim: "rgba(20,20,18,0.38)",
    } satisfies ThemeColorTokens,
    dark: {
      background: "#141412",
      surface: "#1C1C1A",
      subtleSurface: "#242420",
      textPrimary: "#F4F3EF",
      textSecondary: "#B9B6B0",
      borderSubtle: "rgba(255,255,255,0.08)",
      accent: darkAccent,
      accentStrong: "#9E7835",
      accentContrast: "#141412",
      focusRing: "rgba(181,138,60,0.52)",
      kpiHighlight: darkAccent,
      cardAccentSpine: darkAccent,
      success: "#67A67E",
      warning: "#C2934A",
      danger: "#D16B5F",
      info: "#6E96A0",
      overlayScrim: "rgba(8,8,7,0.62)",
    } satisfies ThemeColorTokens,
  },
  typography: {
    fontFamily: {
      primary: '"Inter", "Satoshi", "General Sans", sans-serif',
      numeric: '"IBM Plex Mono", "JetBrains Mono", "SFMono-Regular", monospace',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    lineHeight: {
      compact: 1.2,
      normal: 1.45,
      relaxed: 1.6,
    },
    letterSpacing: {
      tight: "-0.015em",
      normal: "0",
      wide: "0.04em",
      numeric: "0.01em",
    },
    financial: {
      kpi: {
        fontSize: "2.25rem",
        lineHeight: 1.1,
        weight: 600,
      },
      prominent: {
        fontSize: "1.5rem",
        lineHeight: 1.15,
        weight: 600,
      },
      tabularNumerals: true,
    },
  },
  spacing: {
    sectionVertical: "2.4rem",
    sectionVerticalCompact: "1.8rem",
    blockGap: "1.25rem",
    cardPadding: "1.75rem",
    contentInline: "1rem",
    contentInlineDesktop: "1.5rem",
  },
  radius: {
    control: "0.875rem",
    card: "1.125rem",
    modal: "1.25rem",
    pill: "999px",
  },
  layout: {
    appFrameMaxWidth: "430px",
    contentMaxWidth: "1200px",
    readingMaxWidth: "920px",
    stickyHeaderHeight: "72px",
    safeAreaBottomInsetVar: "env(safe-area-inset-bottom, 0px)",
  },
  border: {
    subtleWidth: "1px",
    accentSpineWidth: "3px",
    innerStroke: "inset 0 0 0 1px var(--color-border-subtle)",
  },
  elevation: {
    light: {
      base: "0 1px 2px rgba(20,17,12,0.05), 0 10px 26px rgba(20,17,12,0.04)",
      raised: "0 2px 4px rgba(20,17,12,0.06), 0 16px 34px rgba(20,17,12,0.05)",
      floating:
        "0 4px 8px rgba(20,17,12,0.08), 0 22px 42px rgba(20,17,12,0.07)",
      overlay: "0 8px 16px rgba(20,17,12,0.1), 0 30px 54px rgba(20,17,12,0.09)",
    } satisfies ThemeShadows,
    dark: {
      base: "0 1px 2px rgba(0,0,0,0.24), 0 10px 24px rgba(0,0,0,0.22)",
      raised: "0 2px 4px rgba(0,0,0,0.3), 0 14px 30px rgba(0,0,0,0.28)",
      floating: "0 4px 8px rgba(0,0,0,0.35), 0 18px 38px rgba(0,0,0,0.33)",
      overlay: "0 8px 16px rgba(0,0,0,0.42), 0 24px 48px rgba(0,0,0,0.4)",
    } satisfies ThemeShadows,
  },
  motion: {
    fast: 120,
    standard: 200,
    emphasized: 280,
    modal: 320,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    allowAnimatedProperties: ["transform", "opacity"],
    blockAnimatedProperties: [
      "box-shadow",
      "blur",
      "filter",
      "width",
      "height",
      "margin",
      "padding",
      "top",
      "right",
      "bottom",
      "left",
    ],
  },
  components: {
    institutionCard: {
      padding: "28px",
      radius: "18px",
      accentSpineWidth: "3px",
      accentSpineInset: "0px",
      innerStroke: "inset 0 0 0 1px var(--color-border-subtle)",
      hoverLift: "-2px",
    },
    button: {
      minHeight: "44px",
      radius: "14px",
      pressedScale: 0.97,
      fontWeight: 600,
    },
    floatingDock: {
      radius: "999px",
      paddingInline: "14px",
      paddingBlock: "10px",
      activeTabLift: "-1px",
      indicatorHeight: "2px",
    },
    modal: {
      radius: "20px",
      entryTranslateY: "12px",
    },
    kpi: {
      revealTranslateY: "4px",
      revealStaggerMs: 50,
    },
  },
  chart: {
    axisLabel: "var(--color-text-secondary)",
    axisGrid: "var(--color-border-subtle)",
    billedSeries: "var(--color-accent)",
    collectedSeries: "var(--color-success)",
    outstandingSeries: "var(--color-warning)",
    overdueSeries: "var(--color-danger)",
  },
} as const;

export type InstitutionalTheme = typeof institutionalTheme;

export const resolveThemeMode = (
  preference: ThemePreference,
  systemMode: ThemeMode,
): ThemeMode => {
  if (preference === "system") {
    return systemMode;
  }
  return preference;
};

export const getThemeCssVariables = (
  mode: ThemeMode,
): Record<string, string> => {
  const color = institutionalTheme.color[mode];
  const shadow = institutionalTheme.elevation[mode];

  return {
    "--color-background": color.background,
    "--color-surface": color.surface,
    "--color-surface-subtle": color.subtleSurface,
    "--color-text-primary": color.textPrimary,
    "--color-text-secondary": color.textSecondary,
    "--color-border-subtle": color.borderSubtle,
    "--color-accent": color.accent,
    "--color-accent-strong": color.accentStrong,
    "--color-accent-contrast": color.accentContrast,
    "--color-focus-ring": color.focusRing,
    "--color-kpi-highlight": color.kpiHighlight,
    "--color-card-accent-spine": color.cardAccentSpine,
    "--color-success": color.success,
    "--color-warning": color.warning,
    "--color-danger": color.danger,
    "--color-info": color.info,
    "--color-overlay-scrim": color.overlayScrim,

    "--font-family-primary": institutionalTheme.typography.fontFamily.primary,
    "--font-family-numeric": institutionalTheme.typography.fontFamily.numeric,

    "--space-section-vertical": institutionalTheme.spacing.sectionVertical,
    "--space-section-vertical-compact":
      institutionalTheme.spacing.sectionVerticalCompact,
    "--space-block-gap": institutionalTheme.spacing.blockGap,
    "--space-card-padding": institutionalTheme.spacing.cardPadding,
    "--space-content-inline": institutionalTheme.spacing.contentInline,
    "--space-content-inline-desktop":
      institutionalTheme.spacing.contentInlineDesktop,

    "--radius-control": institutionalTheme.radius.control,
    "--radius-card": institutionalTheme.radius.card,
    "--radius-modal": institutionalTheme.radius.modal,
    "--radius-pill": institutionalTheme.radius.pill,

    "--elevation-base": shadow.base,
    "--elevation-raised": shadow.raised,
    "--elevation-floating": shadow.floating,
    "--elevation-overlay": shadow.overlay,

    "--motion-fast": `${institutionalTheme.motion.fast}ms`,
    "--motion-standard": `${institutionalTheme.motion.standard}ms`,
    "--motion-emphasized": `${institutionalTheme.motion.emphasized}ms`,
    "--motion-modal": `${institutionalTheme.motion.modal}ms`,
    "--motion-easing": institutionalTheme.motion.easing,

    "--layout-app-frame-max-width": institutionalTheme.layout.appFrameMaxWidth,
    "--layout-content-max-width": institutionalTheme.layout.contentMaxWidth,
    "--layout-reading-max-width": institutionalTheme.layout.readingMaxWidth,
    "--layout-sticky-header-height":
      institutionalTheme.layout.stickyHeaderHeight,
    "--layout-safe-area-bottom":
      institutionalTheme.layout.safeAreaBottomInsetVar,

    "--card-inner-stroke": institutionalTheme.border.innerStroke,
    "--card-accent-spine-width": institutionalTheme.border.accentSpineWidth,
  };
};
