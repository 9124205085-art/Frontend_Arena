import { describe, expect, it } from "vitest";
import { fromHousehold, fromSpotify, parseHouseholdDate } from "./normalize";

describe("normalize", () => {
  it("skips household rows without a parseable date", () => {
    expect(
      fromHousehold(
        {
          Date: "not-a-date",
          Mode: "Cash",
          Category: "Food",
          Subcategory: "",
          Note: "x",
          Amount: "10",
          "Income/Expense": "Expense",
          Currency: "INR",
        },
        0,
      ),
    ).toBeNull();
  });

  it("maps a valid household row without inventing fields", () => {
    const r = fromHousehold(
      {
        Date: "14/09/2016 23:48",
        Mode: "Cash",
        Category: "Food",
        Subcategory: "Coffee",
        Note: "Marina stall",
        Amount: "40",
        "Income/Expense": "Expense",
        Currency: "INR",
      },
      1,
    );
    expect(r).not.toBeNull();
    expect(r?.source).toBe("household");
    expect(r?.title).toContain("Marina");
    expect(r?.timestamp.startsWith("2016-09-14")).toBe(true);
    expect(r?.amount).toBe(40);
  });

  it("maps spotify rows to music using artist_name from the file", () => {
    const r = fromSpotify(
      {
        spotify_track_uri: "spotify:track:1",
        ts: "2020-01-01T23:48:00Z",
        platform: "android",
        ms_played: "180000",
        track_name: "Midnight City",
        artist_name: "M83",
        album_name: "Hurry Up",
        reason_start: "clickrow",
        reason_end: "endplay",
        shuffle: "FALSE",
        skipped: "FALSE",
      },
      0,
    );
    expect(r?.type).toBe("music");
    expect(r?.title).toBe("Midnight City");
    expect(r?.extra?.artist).toBe("M83");
  });

  it("parses day-first household dates", () => {
    const d = parseHouseholdDate("01/12/2015");
    expect(d?.getMonth()).toBe(11);
    expect(d?.getDate()).toBe(1);
  });
});
