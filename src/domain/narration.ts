import type { Chapter, Receipt, ReceiptType } from "../data/types";
import { TYPE_LABEL } from "../utils/constants";
import { formatHour } from "../utils/format";
import { getHourlyActivity, getLocationStats, getPatternTraceIds } from "./insights";
import { hourOf } from "./time";

export type NarrationStep = {
  nodeId: string | null;
  text: string;
  duration: number;
  highlightIds?: string[];
};

const TYPE_ACTION: Record<ReceiptType, string> = {
  music: "a song was played",
  movie: "a movie record was logged",
  place: "a visit was recorded",
  purchase: "a purchase appeared",
  photo: "a photo was captured",
  message: "a message was recorded",
  search: "a search was recorded",
  event: "an event was logged",
  note: "a note was written",
};

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

function wordsOrNum(n: number): string {
  if (n >= 0 && n < ONES.length) return ONES[n];
  return n.toLocaleString("en-IN");
}

function spokenTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "an unknown time";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function spokenDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function cleanTitle(title: string): string {
  return title.replace(/[_/]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 72);
}

function spokenEntity(r: Receipt): string {
  const title = cleanTitle(r.title);
  const artist = String(r.extra?.artist || "").trim();
  if (r.type === "music" && artist) return `${title}, by ${artist}`;
  if (r.location && r.type === "place") return r.location;
  return title;
}

function laterPhrase(prev: string, next: string): string {
  const mins = Math.round(Math.abs(new Date(next).getTime() - new Date(prev).getTime()) / 60000);
  if (!Number.isFinite(mins) || mins < 1) return "Moments later";
  if (mins === 1) return "One minute later";
  if (mins < 60) return `${wordsOrNum(mins)} minutes later`;
  const hours = Math.round(mins / 60);
  if (hours === 1) return "About an hour later";
  if (hours < 24) return `${wordsOrNum(hours)} hours later`;
  const days = Math.round(hours / 24);
  if (days === 1) return "The next day";
  return `${wordsOrNum(days)} days later`;
}

/** Approximate spoken length from word count; used as a SpeechSynthesis fallback timer. */
export function estimateSpeechMs(text: string, rate = 1): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1600, Math.round((words / 2.35) * 1000) / rate + 350);
}

function step(text: string, nodeId: string | null, highlightIds?: string[], rate = 1): NarrationStep {
  return {
    nodeId,
    text,
    duration: estimateSpeechMs(text, rate),
    highlightIds,
  };
}

function uniqueIds(ids: (string | null | undefined)[]): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

/**
 * One spoken beat per receipt in a connected path, plus a closing cluster line.
 * Copy is generated from timestamp, type, title, artist, and location fields
 * already present on the receipt — never from a canned script.
 */
export function buildMomentNarration(path: Receipt[], rate = 1): NarrationStep[] {
  if (!path.length) return [];
  const ordered = [...path].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const cluster = ordered.map((r) => r.id);
  const steps: NarrationStep[] = [];

  ordered.forEach((r, i) => {
    const entity = spokenEntity(r);
    const action = TYPE_ACTION[r.type];
    if (i === 0) {
      const loc = r.location ? ` at ${r.location}` : "";
      steps.push(
        step(`On ${spokenDay(r.timestamp)}, at ${spokenTime(r.timestamp)}, ${action}${loc}. ${entity}.`, r.id, cluster, rate),
      );
      return;
    }
    const gap = laterPhrase(ordered[i - 1].timestamp, r.timestamp);
    const loc = r.type === "place" && r.location ? ` to ${r.location}` : r.location ? ` at ${r.location}` : "";
    steps.push(step(`${gap}, ${action}${loc}. ${entity}.`, r.id, cluster, rate));
  });

  const n = ordered.length;
  const t0 = new Date(ordered[0].timestamp).getTime();
  const t1 = new Date(ordered[n - 1].timestamp).getTime();
  const spanMin = Number.isFinite(t0) && Number.isFinite(t1) ? Math.max(0, Math.round((t1 - t0) / 60000)) : 0;
  const spanBit = spanMin > 0 && spanMin < 24 * 60 ? ` across ${wordsOrNum(spanMin)} minutes` : "";
  steps.push(
    step(
      `Together, these ${wordsOrNum(n)} digital traces form one connected moment${spanBit}.`,
      null,
      cluster,
      rate,
    ),
  );
  return steps;
}

export function buildPlaceNarration(location: string, receipts: Receipt[], rate = 1): NarrationStep[] {
  const here = receipts.filter((r) => r.location === location);
  if (!here.length) return [step(`No official records were found for ${location}.`, null, undefined, rate)];
  const byType: Partial<Record<ReceiptType, number>> = {};
  for (const r of here) byType[r.type] = (byType[r.type] ?? 0) + 1;
  const mix = Object.entries(byType)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([t, n]) => `${n} ${TYPE_LABEL[t as ReceiptType].toLowerCase()}`)
    .join(", ");
  const sample = [...here].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).slice(0, 4);
  const cluster = sample.map((r) => r.id);
  const steps: NarrationStep[] = [
    step(
      `${location} appears in ${here.length.toLocaleString("en-IN")} official records. The mix is ${mix}.`,
      null,
      cluster,
      rate,
    ),
  ];
  sample.forEach((r, i) => {
    const prefix = i === 0 ? `One of them: at ${spokenTime(r.timestamp)}` : laterPhrase(sample[i - 1].timestamp, r.timestamp);
    steps.push(step(`${prefix}, ${TYPE_ACTION[r.type]}. ${spokenEntity(r)}.`, r.id, cluster, rate));
  });
  steps.push(step(`These records share the same location field in the archive.`, null, cluster, rate));
  return steps;
}

export function buildPatternNarration(patternId: string, receipts: Receipt[], rate = 1): NarrationStep[] {
  const ids = getPatternTraceIds(receipts, patternId, 8);
  const byId = new Map(receipts.map((r) => [r.id, r]));
  const sample = ids.map((id) => byId.get(id)).filter(Boolean) as Receipt[];
  const cluster = uniqueIds(ids);
  const hours = getHourlyActivity(receipts);
  const night = hours.filter((h) => h.hour >= 22 || h.hour <= 1).reduce((s, h) => s + h.count, 0);
  const nightPct = receipts.length ? Math.round((night / receipts.length) * 100) : 0;
  const peak = [...hours].sort((a, b) => b.count - a.count)[0];
  const typesIn = [...new Set(sample.map((r) => r.type))];
  const typeList = typesIn.map((t) => TYPE_LABEL[t].toLowerCase()).join(", ");

  const intro: Record<string, string> = {};
  intro["night-owl"] =
    `The dataset shows that ${nightPct} percent of records fall between 10 PM and 1 AM. Peak hour is ${peak ? formatHour(peak.hour) : "unknown"}, with ${peak?.count.toLocaleString("en-IN") ?? 0} receipts. ${typeList ? `In this window you will hear ${typeList}.` : ""}`;

  const music = receipts.filter((r) => r.type === "music").length;
  const place = receipts.filter((r) => r.type === "place").length;
  intro["music-move"] =
    `Music appears in ${music.toLocaleString("en-IN")} records. Place records number ${place.toLocaleString("en-IN")}. ${sample.length ? "Here are traces that share a date in the archive." : "The archive does not pair them on the same dates."}`;

  const locs = getLocationStats(receipts);
  intro["explorer"] = locs[0]
    ? `The archive names ${locs.length.toLocaleString("en-IN")} distinct locations. The most recurrent is ${locs[0].location}, with ${locs[0].count.toLocaleString("en-IN")} traces.`
    : "The archive does not contain location fields on these rows.";

  const evening = receipts.filter((r) => r.type === "purchase" && hourOf(r.timestamp) >= 18).length;
  intro["rituals"] =
    `${evening.toLocaleString("en-IN")} purchases are timestamped after 6 PM. Those rows are now highlighted on the network.`;

  const artists = new Map<string, number>();
  for (const r of receipts) {
    const a = String(r.extra?.artist || "").trim();
    if (a) artists.set(a, (artists.get(a) ?? 0) + 1);
  }
  const topArtist = [...artists.entries()].sort((a, b) => b[1] - a[1])[0];
  intro["repeat-artist"] = topArtist
    ? `The Spotify archive names ${topArtist[0]} most often, with ${topArtist[1].toLocaleString("en-IN")} plays. A sample of those listens follows.`
    : "No artist_name field was found in the listening archive.";

  const cats = new Map<string, number>();
  for (const r of receipts) {
    if (r.source !== "household") continue;
    const c = String(r.extra?.category || "").trim();
    if (c) cats.set(c, (cats.get(c) ?? 0) + 1);
  }
  const topCat = [...cats.entries()].sort((a, b) => b[1] - a[1])[0];
  intro["household-mix"] = topCat
    ? `In the household ledger, ${topCat[0]} is the most common category, with ${topCat[1].toLocaleString("en-IN")} rows.`
    : "The household ledger has no Category values to narrate.";

  const opening = intro[patternId] ?? `The archive contains a pattern labelled ${patternId}.`;
  const steps: NarrationStep[] = [step(opening, sample[0]?.id ?? null, cluster, rate)];
  sample.slice(0, 4).forEach((r, i) => {
    if (i === 0 && steps[0].nodeId === r.id) {
      steps[0] = step(`${opening} At ${spokenTime(r.timestamp)}, ${TYPE_ACTION[r.type]}. ${spokenEntity(r)}.`, r.id, cluster, rate);
      return;
    }
    steps.push(
      step(
        `${i === 0 ? `At ${spokenTime(r.timestamp)}` : laterPhrase(sample[i - 1].timestamp, r.timestamp)}, ${TYPE_ACTION[r.type]}. ${spokenEntity(r)}.`,
        r.id,
        cluster,
        rate,
      ),
    );
  });
  steps.push(step("That is what the official records show for this pattern.", null, cluster, rate));
  return steps;
}

export function buildChapterNarration(chapter: Chapter, receipts: Receipt[], rate = 1): NarrationStep[] {
  const byId = new Map(receipts.map((r) => [r.id, r]));
  const members = chapter.receiptIds.map((id) => byId.get(id)).filter(Boolean) as Receipt[];
  const cluster = members.map((r) => r.id);
  const start = chapter.start ? spokenDay(chapter.start) : "an unknown start";
  const end = chapter.end ? spokenDay(chapter.end) : "an unknown end";
  const night =
    chapter.nightOwlScore > 0
      ? ` ${Math.round(chapter.nightOwlScore * 100)} percent of this chapter falls between 10 PM and 1 AM.`
      : "";
  const steps: NarrationStep[] = [
    step(
      `${chapter.title}. ${chapter.kicker}. From ${start} to ${end}. ${chapter.description}${night}`,
      members[0]?.id ?? null,
      cluster,
      rate,
    ),
  ];
  members.slice(0, 4).forEach((r, i) => {
    if (i === 0) return;
    steps.push(step(`${laterPhrase(members[i - 1].timestamp, r.timestamp)}, ${TYPE_ACTION[r.type]}. ${spokenEntity(r)}.`, r.id, cluster, rate));
  });
  steps.push(
    step("These traces belong to this chapter of the archive. The network is showing a connected sample from it.", null, cluster, rate),
  );
  return steps;
}
