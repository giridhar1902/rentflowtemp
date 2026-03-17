export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";
export type ElevationLevel = "base" | "raised" | "floating" | "overlay";

export const THEME_STORAGE_KEY = "domvio.theme.preference";

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

export const domvioTheme = {
  meta: {
    name: "Domvio Design System",
    version: "1.0.0",
    updatedAt: "2026-03-16",
  },
  brand: {
    navy: "#1B2B5E",
    navyLight: "#2D4A9E",
    gold: "#F5A623",
    goldDark: "#E8920F",
  },
  modeDefaults: {
    preference: "light" as ThemePreference,
    fallback: "light" as ThemeMode,
  },
  color: {
    light: {
      background: "#EEF1F8",
      surface: "#FFFFFF",
      subtleSurface: "#F8F9FA",
      textPrimary: "#1B2B5E",
      textSecondary: "#5A6A8A",
      borderSubtle: "rgba(27,43,94,0.09)",
      accent: "#F5A623",
      accentStrong: "#E8920F",
      accentContrast: "#FFFFFF",
      focusRing: "rgba(245,166,35,0.45)",
      kpiHighlight: "#1B2B5E",
      cardAccentSpine: "#F5A623",
      success: "#16A34A",
      warning: "#D97706",
      danger: "#DC2626",
      info: "#2563EB",
      overlayScrim: "rgba(27,43,94,0.4)",
    } satisfies ThemeColorTokens,
    dark: {
      background: "#0F1A38",
      surface: "#1B2B5E",
      subtleSurface: "#243568",
      textPrimary: "#F4F6FB",
      textSecondary: "#A0AFCF",
      borderSubtle: "rgba(255,255,255,0.1)",
      accent: "#F5A623",
      accentStrong: "#E8920F",
      accentContrast: "#1B2B5E",
      focusRing: "rgba(245,166,35,0.5)",
      kpiHighlight: "#F5A623",
      cardAccentSpine: "#F5A623",
      success: "#4ADE80",
      warning: "#FCD34D",
      danger: "#F87171",
      info: "#60A5FA",
      overlayScrim: "rgba(0,0,0,0.6)",
    } satisfies ThemeColorTokens,
  },
  typography: {
    fontFamily: {
      primary: '"Plus Jakarta Sans", sans-serif',
      numeric: '"Plus Jakarta Sans", sans-serif',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
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
    lineHeight: { compact: 1.2, normal: 1.45, relaxed: 1.6 },
    letterSpacing: {
      tight: "-0.015em",
      normal: "0",
      wide: "0.04em",
      numeric: "0.01em",
    },
    financial: {
      kpi: { fontSize: "2.25rem", lineHeight: 1.1, weight: 700 },
      prominent: { fontSize: "1.5rem", lineHeight: 1.15, weight: 600 },
      tabularNumerals: true,
    },
  },
  spacing: {
    sectionVertical: "2.4rem",
    sectionVerticalCompact: "1.8rem",
    blockGap: "1.25rem",
    cardPadding: "1.5rem",
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
    stickyHeaderHeight: "64px",
    safeAreaBottomInsetVar: "env(safe-area-inset-bottom, 0px)",
  },
  border: {
    subtleWidth: "1px",
    accentSpineWidth: "3px",
    innerStroke: "inset 0 0 0 1px var(--color-border-subtle)",
  },
  elevation: {
    light: {
      base: "0 1px 3px rgba(27,43,94,0.06), 0 4px 16px rgba(27,43,94,0.05)",
      raised: "0 2px 6px rgba(27,43,94,0.08), 0 8px 24px rgba(27,43,94,0.07)",
      floating:
        "0 4px 12px rgba(27,43,94,0.1), 0 16px 32px rgba(27,43,94,0.08)",
      overlay:
        "0 8px 24px rgba(27,43,94,0.14), 0 24px 48px rgba(27,43,94,0.12)",
    } satisfies ThemeShadows,
    dark: {
      base: "0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.25)",
      raised: "0 2px 6px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.3)",
      floating: "0 4px 12px rgba(0,0,0,0.4), 0 16px 32px rgba(0,0,0,0.35)",
      overlay: "0 8px 24px rgba(0,0,0,0.5), 0 24px 48px rgba(0,0,0,0.45)",
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
      padding: "24px",
      radius: "16px",
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
    modal: { radius: "20px", entryTranslateY: "12px" },
    kpi: { revealTranslateY: "4px", revealStaggerMs: 50 },
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

// backward-compat alias consumed by existing components
export const institutionalTheme = domvioTheme;

export type DomvioTheme = typeof domvioTheme;
export type InstitutionalTheme = DomvioTheme;

export const resolveThemeMode = (
  preference: ThemePreference,
  systemMode: ThemeMode,
): ThemeMode => {
  if (preference === "system") return systemMode;
  return preference;
};

export const getThemeCssVariables = (
  mode: ThemeMode,
): Record<string, string> => {
  const color = domvioTheme.color[mode];
  const shadow = domvioTheme.elevation[mode];

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

    "--font-family-primary": domvioTheme.typography.fontFamily.primary,
    "--font-family-numeric": domvioTheme.typography.fontFamily.numeric,

    "--space-section-vertical": domvioTheme.spacing.sectionVertical,
    "--space-section-vertical-compact":
      domvioTheme.spacing.sectionVerticalCompact,
    "--space-block-gap": domvioTheme.spacing.blockGap,
    "--space-card-padding": domvioTheme.spacing.cardPadding,
    "--space-content-inline": domvioTheme.spacing.contentInline,
    "--space-content-inline-desktop": domvioTheme.spacing.contentInlineDesktop,

    "--radius-control": domvioTheme.radius.control,
    "--radius-card": domvioTheme.radius.card,
    "--radius-modal": domvioTheme.radius.modal,
    "--radius-pill": domvioTheme.radius.pill,

    "--elevation-base": shadow.base,
    "--elevation-raised": shadow.raised,
    "--elevation-floating": shadow.floating,
    "--elevation-overlay": shadow.overlay,

    "--motion-fast": `${domvioTheme.motion.fast}ms`,
    "--motion-standard": `${domvioTheme.motion.standard}ms`,
    "--motion-emphasized": `${domvioTheme.motion.emphasized}ms`,
    "--motion-modal": `${domvioTheme.motion.modal}ms`,
    "--motion-easing": domvioTheme.motion.easing,

    "--layout-app-frame-max-width": domvioTheme.layout.appFrameMaxWidth,
    "--layout-content-max-width": domvioTheme.layout.contentMaxWidth,
    "--layout-reading-max-width": domvioTheme.layout.readingMaxWidth,
    "--layout-sticky-header-height": domvioTheme.layout.stickyHeaderHeight,
    "--layout-safe-area-bottom": domvioTheme.layout.safeAreaBottomInsetVar,

    "--card-inner-stroke": domvioTheme.border.innerStroke,
    "--card-accent-spine-width": domvioTheme.border.accentSpineWidth,
  };
};
