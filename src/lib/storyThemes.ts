import type { StoryVisual } from "../data/types";

export interface StoryTheme {
  id: StoryVisual;
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  card: string;
  border: string;
  fontDisplay: string;
  fontBody: string;
  light: boolean;
}

export const STORY_THEMES: Record<StoryVisual, StoryTheme> = {
  frequency: {
    id: "frequency",
    bg: "#07060f",
    ink: "#f5f3ff",
    muted: "#c4b5fd",
    accent: "#22d3ee",
    card: "rgba(24, 16, 48, 0.82)",
    border: "rgba(167, 139, 250, 0.28)",
    fontDisplay: '"Syne", sans-serif',
    fontBody: '"Outfit", sans-serif',
    light: false,
  },
  ledger: {
    id: "ledger",
    bg: "#f3ead7",
    ink: "#1a2744",
    muted: "#5c4a32",
    accent: "#9a3412",
    card: "rgba(255, 251, 242, 0.88)",
    border: "rgba(26, 39, 68, 0.18)",
    fontDisplay: '"IBM Plex Serif", Georgia, serif',
    fontBody: '"IBM Plex Mono", ui-monospace, monospace',
    light: true,
  },
  wander: {
    id: "wander",
    bg: "#14241f",
    ink: "#f6efe4",
    muted: "#c5d5c8",
    accent: "#e07a5f",
    card: "rgba(28, 48, 42, 0.86)",
    border: "rgba(224, 122, 95, 0.28)",
    fontDisplay: '"Fraunces", Georgia, serif',
    fontBody: '"Outfit", sans-serif',
    light: false,
  },
};

export const HUB_THEME = {
  bg: "#0c0e12",
  ink: "#eef1f6",
  muted: "#9aa3b5",
  accent: "#e8d5a3",
};
