import type { ReceiptType } from "../data/types";

export const COLORS = {
  bg: "#07070A",
  bg2: "#0D0D12",
  card: "#121218",
  border: "rgba(255,255,255,0.08)",
  text: "#F5F5F7",
  muted: "#9696A5",
  accent: "#7C6BFF",
  accent2: "#5EEAD4",
} as const;

export const TYPE_COLOR: Record<ReceiptType, string> = {
  music: "#A78BFA",
  movie: "#F87171",
  place: "#22D3EE",
  purchase: "#FBBF24",
  photo: "#F472B6",
  message: "#60A5FA",
  search: "#4ADE80",
  event: "#FB923C",
  note: "#F5F5F7",
};

export const TYPE_LABEL: Record<ReceiptType, string> = {
  music: "Music",
  movie: "Movies",
  place: "Places",
  purchase: "Purchases",
  photo: "Photos",
  message: "Messages",
  search: "Searches",
  event: "Events",
  note: "Notes",
};

export const SUGGESTED_SEARCHES = [
  "late night",
  "music",
  "places",
  "train",
  "ganesh",
  "Show me my late nights",
  "Find moments connected to music",
  "Show my most visited places",
];
