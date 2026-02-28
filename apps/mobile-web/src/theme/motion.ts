import { institutionalTheme } from "./theme";

export const motionTokens = institutionalTheme.motion;

export const getRevealDelay = (index: number) =>
  `${Math.max(0, index) * institutionalTheme.components.kpi.revealStaggerMs}ms`;
