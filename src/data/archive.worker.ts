import { buildArchiveBundle } from "./archiveBundle";

self.onmessage = async (event: MessageEvent<{ household: string; spotify: string; india: string }>) => {
  try {
    const { household, spotify, india } = event.data;
    const bundle = buildArchiveBundle(household, spotify, india);
    self.postMessage({ ok: true, bundle });
  } catch (err) {
    self.postMessage({ ok: false, error: err instanceof Error ? err.message : "Failed to parse archives" });
  }
};
