/**
 * Loads the official archive CSVs and normalizes them off the main thread.
 * Does not read public/data/bundle.json.
 */

import { OFFICIAL_SOURCES } from "./sources";
import type { Chapter, ConnectionEdge, Receipt, ReceiptType } from "./types";
import type { Pattern } from "../utils/analyzeData";

export type ArchiveBundle = {
  receipts: Receipt[];
  edges: ConnectionEdge[];
  chapters: Chapter[];
  presentTypes: ReceiptType[];
  overview: ReturnType<typeof import("../utils/analyzeData").getOverview>;
  patterns: Pattern[];
  years: number[];
  locationStats: ReturnType<typeof import("../utils/analyzeData").getLocationStats>;
};

async function fetchText(url: string, label: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not read official ${label} file (${res.status})`);
  return res.text();
}

async function parseOnMainThread(household: string, spotify: string, india: string): Promise<ArchiveBundle> {
  const { buildArchiveBundle } = await import("./archiveBundle");
  return buildArchiveBundle(household, spotify, india);
}

/**
 * Fetch the three official CSVs, then parse/connect/analyze off the main thread.
 * Worker timeout is 120s; on timeout, crash, or missing Worker, falls back to `buildArchiveBundle`.
 */
export async function loadOfficialArchive(): Promise<ArchiveBundle> {
  const [household, spotify, india] = await Promise.all([
    fetchText(OFFICIAL_SOURCES.household.url, "household"),
    fetchText(OFFICIAL_SOURCES.spotify.url, "spotify"),
    fetchText(OFFICIAL_SOURCES.india.url, "india transactions"),
  ]);

  if (typeof Worker !== "undefined") {
    try {
      const worker = new Worker(new URL("./archive.worker.ts", import.meta.url), { type: "module" });
      return await new Promise<ArchiveBundle>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          worker.terminate();
          reject(new Error("Archive worker timed out"));
        }, 120_000);
        worker.onmessage = (event: MessageEvent<{ ok: boolean; bundle?: ArchiveBundle; error?: string }>) => {
          window.clearTimeout(timer);
          worker.terminate();
          if (event.data.ok && event.data.bundle) resolve(event.data.bundle);
          else reject(new Error(event.data.error || "Archive worker failed"));
        };
        worker.onerror = () => {
          window.clearTimeout(timer);
          worker.terminate();
          reject(new Error("Archive worker crashed"));
        };
        worker.postMessage({ household, spotify, india });
      });
    } catch {
      return parseOnMainThread(household, spotify, india);
    }
  }

  return parseOnMainThread(household, spotify, india);
}
