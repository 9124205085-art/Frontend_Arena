"""
Curate a story-sized bundle from the three hackathon archives.

We do not dump 150k Spotify rows into the browser. Instead we keep the
original field names, sample the moments that actually carry narrative
weight, and write a small JSON bundle that dataLoader.ts will normalize.
"""

from __future__ import annotations

import csv
import json
import os
import random
from datetime import datetime, timedelta
from typing import Any

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(BASE, "public", "data", "bundle.json")
RNG = random.Random(42)


def parse_household_date(raw: str) -> datetime | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    for fmt in (
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
        "%d/%m/%y %H:%M:%S",
        "%d/%m/%y",
    ):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def parse_spotify_date(raw: str) -> datetime | None:
    raw = (raw or "").strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def parse_india_date(raw: str) -> datetime | None:
    raw = (raw or "").strip()
    for fmt in ("%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M", "%m/%d/%Y"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def load_household() -> list[dict[str, str]]:
    path = os.path.join(BASE, "archive (1) (1)", "Daily Household Transactions.csv")
    with open(path, encoding="utf-8", errors="replace") as f:
        return list(csv.DictReader(f))


def load_spotify() -> list[dict[str, str]]:
    path = os.path.join(BASE, "archive (3)", "spotify_history.csv")
    rows: list[dict[str, str]] = []
    with open(path, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def load_india() -> list[dict[str, str]]:
    path = os.path.join(
        BASE, "archive (2) (1)", "Augmented_IndiaTransactMultiFacet2024.csv"
    )
    with open(path, encoding="utf-8", errors="replace") as f:
        return list(csv.DictReader(f))


def note_of(row: dict[str, str]) -> str:
    return (row.get("Note") or "").strip()


def cat_of(row: dict[str, str]) -> str:
    return (row.get("Category") or "").strip()


def sub_of(row: dict[str, str]) -> str:
    return (row.get("Subcategory") or "").strip()


def pick_household(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    scored: list[tuple[int, dict[str, str]]] = []
    seen_keys: set[str] = set()

    keywords = (
        "netflix",
        "ganesh",
        "ganpati",
        "navratri",
        "holi",
        "firecracker",
        "rangoli",
        "aakash",
        "bhaiduj",
        "raksha",
        "decathlon",
        "domino",
        "sevagram",
        "amritsar",
        "patna",
        "dadar",
        "sion",
        "ltt",
        "cataract",
        "farewell",
        "kindle",
        "audible",
        "prime",
        "restaurant",
        "mall",
        "glasses",
        "eyewear",
        "offering",
        "idol",
        "permanent residence",
        "current residence",
        "place 0",
        "place 2",
        "place 3",
        "workplace",
    )

    for row in rows:
        cat = cat_of(row).lower()
        sub = sub_of(row).lower()
        note = note_of(row).lower()
        blob = f"{cat} {sub} {note}"
        score = 0

        if cat in {"festivals", "gift", "education"}:
            score += 8
        if cat == "health" and any(k in blob for k in ("cataract", "hospital", "eyewear", "glasses")):
            score += 7
        if cat == "subscription" and any(k in blob for k in ("netflix", "kindle", "audible", "prime", "edtech")):
            score += 8
        if "train" in sub or "train" in note:
            score += 3
        if any(k in note for k in ("sevagram", "amritsar", "patna", "dadar", "sion", "ltt", "decathlon")):
            score += 10
        if any(k in blob for k in keywords):
            score += 4
        if cat == "salary":
            score += 2
        if "domino" in note or "restaurant" in note:
            score += 6
        if cat == "food" and sub in {"dinner", "lunch"} and "milk" not in note:
            try:
                if float(row.get("Amount") or 0) >= 200:
                    score += 3
            except ValueError:
                pass

        # skip the daily milk / atta drone unless they somehow scored high
        if score < 3:
            continue
        if "milk" in note and score < 8:
            continue

        key = f"{row.get('Date')}|{cat}|{sub}|{note}|{row.get('Amount')}"
        if key in seen_keys:
            continue
        seen_keys.add(key)
        scored.append((score, row))

    scored.sort(key=lambda x: -x[0])
    picked = [r for _, r in scored[:52]]

    # keep chronological-ish diversity: cap per year
    by_year: dict[str, list[dict[str, str]]] = {}
    for row in picked:
        dt = parse_household_date(row.get("Date") or "")
        year = str(dt.year) if dt else "unk"
        by_year.setdefault(year, []).append(row)

    final: list[dict[str, str]] = []
    for year, group in sorted(by_year.items()):
        final.extend(group[:16])
    return final[:48]


def pick_spotify(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    """Keep fully-heard tracks with story weight, spread across years."""
    wanted_artists = {
        "lana del rey",
        "the beatles",
        "the killers",
        "john mayer",
        "bob dylan",
        "radiohead",
        "howard shore",
        "weezer",
        "arctic monkeys",
        "pink floyd",
        "coldplay",
        "imagine dragons",
        "mgmt",
        "m83",
        "frank ocean",
        "the rolling stones",
        "led zeppelin",
        "the strokes",
        "kings of leon",
        "ed sheeran",
        "paul mccartney",
        "johnny cash",
        "the black keys",
        "cage the elephant",
    }
    wanted_titles = {
        "born to die",
        "midnight city",
        "electric feel",
        "like a rolling stone",
        "imploding the mirage",
        "aloo gobi",
        "gravity",
        "hey jude",
        "let it be",
        "something",
        "blackbird",
        "creep",
        "karma police",
        "concerning hobbits",
        "the breaking of the fellowship",
        "mr. brightside",
        "somebody told me",
        "do i wanna know?",
        "kids",
        "take a walk",
        "wish you were here",
        "comfortably numb",
        "the night we met",
    }

    buckets: dict[str, list[tuple[int, dict[str, str]]]] = {}
    for row in rows:
        try:
            ms = int(row.get("ms_played") or 0)
        except ValueError:
            ms = 0
        if ms < 90_000:
            continue
        if (row.get("skipped") or "").upper() == "TRUE":
            continue
        dt = parse_spotify_date(row.get("ts") or "")
        if not dt:
            continue

        artist = (row.get("artist_name") or "").strip()
        title = (row.get("track_name") or "").strip()
        al = artist.lower()
        tl = title.lower()
        hour = dt.hour
        score = 1
        if al in wanted_artists:
            score += 5
        if tl in wanted_titles or any(t in tl for t in wanted_titles):
            score += 8
        if hour <= 4 or hour >= 23:
            score += 3
        if ms >= 180_000:
            score += 2
        # prefer completed listens
        if (row.get("reason_end") or "") == "trackdone":
            score += 2

        key = f"{dt.year}-{dt.month:02d}"
        buckets.setdefault(key, []).append((score, row))

    picked: list[dict[str, str]] = []
    seen_tracks: set[str] = set()
    for key in sorted(buckets):
        group = sorted(buckets[key], key=lambda x: -x[0])
        taken = 0
        for score, row in group:
            sig = f"{(row.get('track_name') or '').lower()}|{(row.get('artist_name') or '').lower()}"
            if sig in seen_tracks and score < 10:
                continue
            seen_tracks.add(sig)
            picked.append(row)
            taken += 1
            if taken >= 2:
                break

    # Guarantee a handful of iconic rows even if the monthly cap missed them
    guaranteed = []
    for row in rows:
        tl = (row.get("track_name") or "").lower()
        al = (row.get("artist_name") or "").lower()
        try:
            ms = int(row.get("ms_played") or 0)
        except ValueError:
            ms = 0
        if ms < 60_000:
            continue
        if (
            "born to die" in tl
            or "aloo gobi" in tl
            or "imploding the mirage" in tl
            or (al == "howard shore" and ms > 120_000)
            or tl == "midnight city"
            or "like a rolling stone" in tl
        ):
            guaranteed.append(row)

    by_sig = {}
    for row in guaranteed + picked:
        sig = f"{row.get('ts')}|{row.get('track_name')}"
        by_sig[sig] = row
    final = list(by_sig.values())
    final.sort(key=lambda r: r.get("ts") or "")
    # Cap music so leaves stay clickable
    if len(final) > 42:
        # keep earliest, latest, and evenly sampled middle
        keep = [final[0], final[-1]]
        step = max(1, len(final) // 40)
        keep.extend(final[1:-1:step])
        # always keep high-score titles
        for row in final:
            tl = (row.get("track_name") or "").lower()
            if any(
                k in tl
                for k in (
                    "born to die",
                    "aloo gobi",
                    "imploding",
                    "midnight city",
                    "like a rolling stone",
                    "concerning hobbits",
                    "blackbird",
                    "mr. brightside",
                    "gravity",
                )
            ):
                keep.append(row)
        uniq = {}
        for row in keep:
            uniq[f"{row.get('ts')}|{row.get('track_name')}"] = row
        final = sorted(uniq.values(), key=lambda r: r.get("ts") or "")[:42]
    return final


def pick_india(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    by_month: dict[str, list[dict[str, str]]] = {}
    for row in rows:
        city = (row.get("city") or "").strip()
        cat = (row.get("category") or "").strip()
        state = (row.get("state") or "").strip()
        merchant = (row.get("merchant") or "").strip()
        if not city or not cat or not merchant:
            continue
        dt = parse_india_date(row.get("trans_date_trans_time") or "")
        if not dt:
            continue
        try:
            amt = float(row.get("amt") or 0)
        except ValueError:
            continue
        if amt <= 0:
            continue
        key = f"{dt.year}-{dt.month:02d}"
        by_month.setdefault(key, []).append(row)

    picked: list[dict[str, str]] = []
    seen_cities: set[str] = set()
    for key in sorted(by_month):
        group = by_month[key]
        RNG.shuffle(group)
        # prefer unseen cities for a travel-feeling chapter
        group.sort(key=lambda r: (r.get("city") or "") in seen_cities)
        take = 0
        cats_this_month: set[str] = set()
        for row in group:
            cat = row.get("category") or ""
            if cat in cats_this_month and take >= 1:
                continue
            picked.append(row)
            seen_cities.add((row.get("city") or "").strip())
            cats_this_month.add(cat)
            take += 1
            if take >= 2:
                break
    return picked[:28]


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%S")


def build_derived(
    household: list[dict[str, str]],
    spotify: list[dict[str, str]],
    india: list[dict[str, str]],
) -> list[dict[str, Any]]:
    """
    Photos, messages, searches, notes, events that are NOT in the raw
    archives — they are inferred from them, so the story can show the
    types the brief asks for, while still being anchored to real rows.
    """
    derived: list[dict[str, Any]] = []

    def near(raw_date: str, parser, hours_delta: int = -3) -> str:
        dt = parser(raw_date) or datetime(2017, 1, 1)
        return iso(dt + timedelta(hours=hours_delta))

    # --- from household ---
    for row in household:
        note = note_of(row)
        cat = cat_of(row)
        sub = sub_of(row)
        d = row.get("Date") or ""
        low = f"{note} {cat} {sub}".lower()

        if "ganesh" in low or "ganpati" in low:
            derived.append(
                {
                    "id": f"photo-ganesh-{d[:10]}",
                    "kind": "photo",
                    "timestamp": near(d, parse_household_date, 2),
                    "title": "Ganesh idol, balcony light",
                    "body": "Still-wet paint. The idol faces the street the way it did at Permanent Residence, even though this is Current Residence now.",
                    "location": "Current Residence",
                    "tags": ["ganesh", "festival", "home", "photo"],
                    "mood": "devotional",
                    "mentions": ["Ganesh", "Permanent Residence", "Current Residence"],
                }
            )
            derived.append(
                {
                    "id": f"event-ganesh-{d[:10]}",
                    "kind": "event",
                    "timestamp": near(d, parse_household_date, 1),
                    "title": "Ganesh Chaturthi at home",
                    "body": "Modak steam in the kitchen. Someone puts on an old bhajan, then immediately skips it. The idol is new. The ritual is not.",
                    "location": "Current Residence",
                    "tags": ["ganesh", "navratri", "festival", "family"],
                    "mood": "warm",
                    "mentions": ["Ganesh", "Navratri"],
                }
            )
        if "sevagram" in low:
            derived.append(
                {
                    "id": f"search-sevagram-{d[:10]}",
                    "kind": "search",
                    "timestamp": near(d, parse_household_date, -26),
                    "title": "Sevagram Express 3AC availability",
                    "body": "Typed at 1:14 AM. Refreshed four times. The berth toward Place 3 only exists if you catch it early.",
                    "location": "Current Residence",
                    "tags": ["train", "sevagram", "place 3", "search"],
                    "mood": "restless",
                    "mentions": ["Sevagram", "Place 3", "3AC"],
                }
            )
            derived.append(
                {
                    "id": f"msg-train-{d[:10]}",
                    "kind": "message",
                    "timestamp": near(d, parse_household_date, 4),
                    "title": "Don't wait up",
                    "body": "Reached Place 2. Sevagram is late, as usual. There is a man selling chai at the door like nothing in the country has changed.",
                    "location": "Place 2",
                    "tags": ["train", "place 2", "family", "message"],
                    "mood": "tender",
                    "mentions": ["Place 2", "Sevagram"],
                }
            )
        if "amritsar" in low:
            derived.append(
                {
                    "id": f"note-amritsar-{d[:10]}",
                    "kind": "note",
                    "timestamp": near(d, parse_household_date, 6),
                    "title": "Amritsar Express, upper berth",
                    "body": "The ledger will record 3AC and a fare. It will not record that I watched the dark go by and replayed the same three Beatles songs until the phone died.",
                    "location": "Amritsar Express",
                    "tags": ["train", "beatles", "night", "note"],
                    "mood": "solitary",
                    "mentions": ["Amritsar", "Beatles"],
                }
            )
        if "cataract" in low or "eyewear" in low or "glasses" in low:
            derived.append(
                {
                    "id": f"search-cataract-{d[:10]}",
                    "kind": "search",
                    "timestamp": near(d, parse_household_date, -2),
                    "title": "cataract recovery time Mumbai",
                    "body": "A practical search. Under it, a less practical one that was deleted: how long until the world looks expensive again.",
                    "location": "Mumbai",
                    "tags": ["health", "cataract", "mumbai", "search"],
                    "mood": "anxious",
                    "mentions": ["cataract", "Mumbai"],
                }
            )
        if "farewell" in low:
            derived.append(
                {
                    "id": f"msg-farewell-{d[:10]}",
                    "kind": "message",
                    "timestamp": near(d, parse_household_date, 1),
                    "title": "Contribution sent",
                    "body": "Sent my share for the farewell. I still don't know if I'm supposed to feel lighter. The office playlist was Imagine Dragons. Of course it was.",
                    "tags": ["farewell", "work", "imagine dragons"],
                    "mood": "bittersweet",
                    "mentions": ["farewell", "Imagine Dragons"],
                }
            )
        if "netflix" in low:
            derived.append(
                {
                    "id": f"movie-netflix-{d[:10]}",
                    "kind": "movie",
                    "timestamp": near(d, parse_household_date, 8),
                    "title": "A film I will not name in the ledger",
                    "body": "Netflix billed 199. Somewhere behind that number: a hobbit theme, a paused screen, a person who meant to sleep.",
                    "location": "Current Residence",
                    "tags": ["netflix", "movie", "howard shore", "night"],
                    "mood": "hushed",
                    "mentions": ["Netflix", "Howard Shore"],
                }
            )
        if "domino" in low:
            derived.append(
                {
                    "id": f"photo-pizza-{d[:10]}",
                    "kind": "photo",
                    "timestamp": near(d, parse_household_date, 1),
                    "title": "Domino's box, 10:01 PM",
                    "body": "Flash on. Grease on the lid. In the next room the salary SMS has already arrived. Two receipts, one night.",
                    "location": "Current Residence",
                    "tags": ["food", "domino's", "photo", "night"],
                    "mood": "ordinary",
                    "mentions": ["Domino's", "salary"],
                }
            )
        if "decathlon" in low:
            derived.append(
                {
                    "id": f"photo-decathlon-{d[:10]}",
                    "kind": "photo",
                    "timestamp": near(d, parse_household_date, 0),
                    "title": "Outside Decathlon, Place A",
                    "body": "A bag that looks like a decision. Auto to the station after. The photo is mostly sky.",
                    "location": "Place A",
                    "tags": ["decathlon", "place a", "photo"],
                    "mood": "hopeful",
                    "mentions": ["Decathlon", "Place A"],
                }
            )
        if "dadar" in low or "sion" in low:
            derived.append(
                {
                    "id": f"note-local-{d[:10]}",
                    "kind": "note",
                    "timestamp": near(d, parse_household_date, -1),
                    "title": "Place 0 is not a place",
                    "body": "The ledger anonymizes the stations. I know them by smell: Dadar at dusk, Sion after rain, LTT when the Patna Exp is being cancelled in real time.",
                    "location": "Place 0",
                    "tags": ["place 0", "dadar", "sion", "mumbai", "note"],
                    "mood": "wry",
                    "mentions": ["Place 0", "Dadar", "Sion", "LTT"],
                }
            )
        if "firecracker" in low or "rangoli" in low or "aakash" in low:
            derived.append(
                {
                    "id": f"event-diwali-{d[:10]}",
                    "kind": "event",
                    "timestamp": near(d, parse_household_date, 0),
                    "title": "Diwali, before the smoke",
                    "body": "Rangoli that will be feet by morning. An aakash kandil that leans. Someone's playlist keeps slipping into The Beatles.",
                    "location": "Permanent Residence",
                    "tags": ["diwali", "festival", "beatles", "home"],
                    "mood": "bright",
                    "mentions": ["Diwali", "Rangoli", "Beatles"],
                }
            )
        if "bhaiduj" in low or "raksha" in low:
            derived.append(
                {
                    "id": f"event-sibling-{d[:10]}",
                    "kind": "event",
                    "timestamp": near(d, parse_household_date, 0),
                    "title": "A festival that still requires showing up",
                    "body": "Mi Band 5 wrapped in newspaper. Ovalni envelopes. The ledger calls it a festival. The body calls it going home.",
                    "location": "Permanent Residence",
                    "tags": ["family", "bhaidooj", "rakshabandhan", "gift"],
                    "mood": "tender",
                    "mentions": ["Bhaidooj", "Rakshabandhan", "Permanent Residence"],
                }
            )
        if "kindle" in low or "audible" in low:
            derived.append(
                {
                    "id": f"note-listen-{d[:10]}",
                    "kind": "note",
                    "timestamp": near(d, parse_household_date, 5),
                    "title": "Headphones instead of people",
                    "body": "Audible and Kindle Unlimited in the same season as the late trains. I was collecting voices that could not ask me how work was.",
                    "tags": ["audible", "kindle", "solitude", "note"],
                    "mood": "insular",
                    "mentions": ["Audible", "Kindle"],
                }
            )

    # --- from spotify ---
    for row in spotify:
        title = (row.get("track_name") or "").strip()
        artist = (row.get("artist_name") or "").strip()
        ts = row.get("ts") or ""
        low = f"{title} {artist}".lower()
        dt = parse_spotify_date(ts)
        if not dt:
            continue
        hour = dt.hour

        if "born to die" in low:
            derived.append(
                {
                    "id": "note-first-night",
                    "kind": "note",
                    "timestamp": iso(dt + timedelta(minutes=12)),
                    "title": "The first night the archive remembers",
                    "body": "Lana Del Rey at 2:50 AM on a web player. 2013. Nobody is keeping a household ledger yet. This is the oldest leaf.",
                    "tags": ["lana del rey", "night", "origin", "note"],
                    "mood": "mythic",
                    "mentions": ["Lana Del Rey", "Born To Die"],
                }
            )
        if "aloo gobi" in low:
            derived.append(
                {
                    "id": "note-aloo-gobi",
                    "kind": "note",
                    "timestamp": iso(dt + timedelta(minutes=8)),
                    "title": "Aloo gobi, 2024",
                    "body": "Weezer named a song after a dish the 2015 kitchen would have understood. The ledger is gone. The stove is not. Smallness is allowed.",
                    "tags": ["weezer", "food", "home", "note"],
                    "mood": "amused",
                    "mentions": ["Aloo Gobi", "Weezer", "kitchen"],
                }
            )
            derived.append(
                {
                    "id": "search-aloo-gobi",
                    "kind": "search",
                    "timestamp": iso(dt - timedelta(hours=2)),
                    "title": "aloo gobi recipe without too many dishes",
                    "body": "A practical search sitting on top of an impractical decade.",
                    "tags": ["food", "search", "home"],
                    "mood": "domestic",
                    "mentions": ["aloo gobi"],
                }
            )
        if "howard shore" in low or "hobbit" in low or "fellowship" in low:
            derived.append(
                {
                    "id": f"movie-shire-{ts[:10]}",
                    "kind": "movie",
                    "timestamp": iso(dt),
                    "title": "The Shire, through cheap speakers",
                    "body": "Howard Shore. A Netflix subscription somewhere in the same life. Middle-earth as a way not to be in this room.",
                    "tags": ["howard shore", "lotr", "netflix", "movie"],
                    "mood": "escaped",
                    "mentions": ["Howard Shore", "Netflix", "Fellowship"],
                }
            )
        if "imploding the mirage" in low:
            derived.append(
                {
                    "id": "search-mirage",
                    "kind": "search",
                    "timestamp": iso(dt + timedelta(minutes=30)),
                    "title": "Imploding the Mirage album meaning",
                    "body": "2020. The Killers. A search that is really the question: is anyone else still awake.",
                    "tags": ["the killers", "lockdown", "search", "night"],
                    "mood": "insular",
                    "mentions": ["The Killers", "Imploding the Mirage"],
                }
            )
        if hour <= 3 and artist.lower() in {"the beatles", "bob dylan", "john mayer", "radiohead"}:
            derived.append(
                {
                    "id": f"msg-awake-{ts[:10]}",
                    "kind": "message",
                    "timestamp": iso(dt + timedelta(minutes=4)),
                    "title": "Are you up",
                    "body": f"Drafted, not sent. {artist} was already answering.",
                    "tags": ["night", "message", artist.lower(), "unsent"],
                    "mood": "lonely",
                    "mentions": [artist],
                }
            )

    # --- from india travel years ---
    cities = []
    for row in india:
        city = (row.get("city") or "").strip()
        cat = (row.get("category") or "").strip()
        dt = parse_india_date(row.get("trans_date_trans_time") or "")
        if city and dt:
            cities.append((dt, city, cat, row.get("merchant") or "", row.get("state") or ""))
    cities.sort()
    if cities:
        first = cities[0]
        derived.append(
            {
                "id": "note-ledger-closed",
                "kind": "note",
                "timestamp": iso(first[0] - timedelta(days=12)),
                "title": "The ledger stopped. I didn't.",
                "body": "Household rows end in 2018. The music kept falling. Then the card receipts start naming cities the old trains never reached.",
                "tags": ["ledger", "travel", "note", "time"],
                    "mood": "clear",
                "mentions": ["ledger", "train", first[1]],
            }
        )
        derived.append(
            {
                "id": "photo-first-city",
                "kind": "photo",
                "timestamp": iso(first[0] + timedelta(hours=3)),
                "title": f"Window, {first[1]}",
                "body": f"A city the 2017 commute could not have predicted. {first[4]}. The photo is crooked because the bus moved.",
                "location": first[1],
                "tags": ["travel", "photo", first[1].lower(), (first[4] or "").lower()],
                "mood": "awake",
                "mentions": [first[1], "travel"],
            }
        )

    # unique-ish travel notes for a few cities
    seen = set()
    for dt, city, cat, merchant, state in cities:
        if city in seen:
            continue
        seen.add(city)
        if len(seen) > 6:
            break
        if cat == "travel":
            derived.append(
                {
                    "id": f"search-stay-{city.lower()[:8]}-{dt.date()}",
                    "kind": "search",
                    "timestamp": iso(dt - timedelta(hours=18)),
                    "title": f"late night food near {city} station",
                    "body": "Some habits survive every city: arrive hungry, search badly, walk anyway.",
                    "location": city,
                    "tags": ["travel", "search", "food", city.lower()],
                    "mood": "hungry",
                    "mentions": [city, "station"],
                }
            )
        if cat == "entertainment":
            derived.append(
                {
                    "id": f"movie-ticket-{city.lower()[:8]}-{dt.date()}",
                    "kind": "movie",
                    "timestamp": iso(dt),
                    "title": f"A screen in {city}",
                    "body": f"Entertainment, billed. The merchant will be forgotten. The dark of the hall will not.",
                    "location": city,
                    "tags": ["movie", "entertainment", city.lower()],
                    "mood": "hushed",
                    "mentions": [city, "entertainment"],
                }
            )
        if cat == "fitness_and_medical":
            derived.append(
                {
                    "id": f"event-body-{city.lower()[:8]}",
                    "kind": "event",
                    "timestamp": iso(dt),
                    "title": f"Trying, in {city}",
                    "body": "A fitness charge in a city that is not home. Proof that the body still wanted a plot twist.",
                    "location": city,
                    "tags": ["fitness", "health", "event", city.lower()],
                    "mood": "determined",
                    "mentions": [city, "fitness"],
                }
            )

    # Dedup by id
    uniq: dict[str, dict[str, Any]] = {}
    for item in derived:
        uniq[item["id"]] = item
    items = list(uniq.values())
    items.sort(key=lambda x: x.get("timestamp") or "")
    return items[:36]


def main() -> None:
    print("Loading archives...")
    household_all = load_household()
    spotify_all = load_spotify()
    india_all = load_india()
    print(f"  household={len(household_all)} spotify={len(spotify_all)} india={len(india_all)}")

    household = pick_household(household_all)
    spotify = pick_spotify(spotify_all)
    india = pick_india(india_all)
    derived = build_derived(household, spotify, india)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bundle = {
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "sources": {
            "household": {
                "file": "archive (1) (1)/Daily Household Transactions.csv",
                "originalRows": len(household_all),
                "sampled": len(household),
                "fields": [
                    "Date",
                    "Mode",
                    "Category",
                    "Subcategory",
                    "Note",
                    "Amount",
                    "Income/Expense",
                    "Currency",
                ],
            },
            "spotify": {
                "file": "archive (3)/spotify_history.csv",
                "originalRows": len(spotify_all),
                "sampled": len(spotify),
                "fields": [
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
            "india": {
                "file": "archive (2) (1)/Augmented_IndiaTransactMultiFacet2024.csv",
                "originalRows": len(india_all),
                "sampled": len(india),
                "fields": [
                    "trans_id",
                    "trans_date_trans_time",
                    "merchant",
                    "category",
                    "amt",
                    "city",
                    "state",
                    "job",
                    "is_fraud",
                ],
            },
        },
        "household": household,
        "spotify": spotify,
        "india": india,
        "derived": derived,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(bundle, f, ensure_ascii=False, indent=2)

    print(f"Wrote {OUT}")
    print(
        f"sampled household={len(household)} spotify={len(spotify)} india={len(india)} derived={len(derived)}"
    )


if __name__ == "__main__":
    main()
