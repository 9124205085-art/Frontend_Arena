import type { ReceiptType } from "../data/types";

export const TYPE_COLOR: Record<ReceiptType, string> = {
  music: "#22d3ee",
  movie: "#a78bfa",
  place: "#81b29a",
  purchase: "#e07a5f",
  photo: "#f0c36a",
  message: "#60a5fa",
  search: "#f9a8d4",
  event: "#f97316",
  note: "#e8d5a3",
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

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
