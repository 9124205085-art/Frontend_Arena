import type { AppMode, Chapter, Receipt } from "../data/types";
import { hashId, mulberry32 } from "../lib/theme";

export function chapterCenter(index: number): [number, number, number] {
  const t = index * 0.85;
  return [Math.sin(t) * 3.4, 0.15, -index * 8.5];
}

export function storyRest(receipt: Receipt, chapters: Chapter[]): [number, number, number] {
  const ci = Math.max(
    0,
    chapters.findIndex((c) => c.receiptIds.includes(receipt.id)),
  );
  const chapter = chapters[ci];
  const [cx, cy, cz] = chapterCenter(ci);
  const local = chapter ? chapter.receiptIds.indexOf(receipt.id) : 0;
  const n = chapter ? Math.max(1, chapter.receiptIds.length) : 1;
  const rng = mulberry32(hashId(receipt.id));
  const ring = 1.1 + (local % 5) * 0.28;
  const a = (local / n) * Math.PI * 2 + rng() * 0.4;
  return [
    cx + Math.cos(a) * ring + (rng() - 0.5) * 0.4,
    cy + rng() * 0.8 + (local % 3) * 0.12,
    cz + Math.sin(a) * ring * 0.7 + (rng() - 0.5) * 0.35,
  ];
}

export function exploreRest(receipt: Receipt, index: number, total: number): [number, number, number] {
  const phi = Math.acos(1 - (2 * (index + 0.5)) / Math.max(1, total));
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  const rng = mulberry32(hashId(receipt.id) ^ 0x9e3779b9);
  const r = 6.2 + rng() * 1.6;
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi) * 0.75,
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

export function spawnSeed(id: string): { x: number; y: number; z: number; speed: number; phase: number } {
  const rng = mulberry32(hashId(id));
  return {
    x: (rng() - 0.5) * 16,
    y: rng() * 14 + 4,
    z: (rng() - 0.5) * 10 - 2,
    speed: 0.35 + rng() * 0.85,
    phase: rng() * Math.PI * 2,
  };
}

export function restFor(
  receipt: Receipt,
  index: number,
  total: number,
  chapters: Chapter[],
  mode: AppMode,
): [number, number, number] {
  if (mode === "story") return storyRest(receipt, chapters);
  if (mode === "explore") return exploreRest(receipt, index, total);
  const s = spawnSeed(receipt.id);
  return [s.x, s.y, s.z];
}
