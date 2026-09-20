/**
 * Official hackathon sources — original files, never rewritten.
 * Vite serves them as assets; the archives on disk stay untouched.
 */
import householdUrl from "../../archive (1) (1)/Daily Household Transactions.csv?url";
import spotifyUrl from "../../archive (3)/spotify_history.csv?url";
import indiaUrl from "../../archive (2) (1)/Augmented_IndiaTransactMultiFacet2024.csv?url";

export const OFFICIAL_SOURCES = {
  household: {
    file: "archive (1) (1)/Daily Household Transactions.csv",
    url: householdUrl,
    fields: ["Date", "Mode", "Category", "Subcategory", "Note", "Amount", "Income/Expense", "Currency"],
  },
  spotify: {
    file: "archive (3)/spotify_history.csv",
    url: spotifyUrl,
    fields: [
      "spotify_track_uri",
      "ts",
      "platform",
      "ms_played",
      "track_name",
      "artist_name",
      "album_name",
      "reason_start",
      "reason_end",
      "shuffle",
      "skipped",
    ],
  },
  india: {
    file: "archive (2) (1)/Augmented_IndiaTransactMultiFacet2024.csv",
    url: indiaUrl,
    fields: [
      "trans_id",
      "trans_date_trans_time",
      "cc_num",
      "merchant",
      "category",
      "amt",
      "first",
      "last",
      "gender",
      "street",
      "city",
      "state",
      "lat",
      "long",
      "city_pop",
      "job",
      "dob",
      "merch_lat",
      "merch_long",
      "is_fraud",
      "customer_id",
    ],
  },
} as const;
