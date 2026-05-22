"""
07_search_index.py — Build a lightweight JSON search index for the frontend.

For each name: key stats including peak_year, peak_rate, half_life,
curve_type, era, gender, lifetime_births, current_rate.
"""

from pathlib import Path
import json
import pandas as pd

ROOT = Path(__file__).resolve().parent
LONG = ROOT / "data" / "clean" / "names_long.parquet"
WAVES = ROOT / "output" / "waves.json"
ERAS = ROOT / "output" / "eras.json"
OUT = ROOT / "output" / "search_index.json"


def main():
    print("07_search_index: loading data …")
    df = pd.read_parquet(LONG)

    # Load waves
    with open(WAVES) as f:
        waves = json.load(f)
    wave_lookup = {(w["name"], w["gender"]): w for w in waves}

    # Load eras
    with open(ERAS) as f:
        eras_data = json.load(f)
    era_lookup = {a["name"]: a["cluster"] for a in eras_data["assignments"]}
    era_meta = eras_data["eras"]

    # Current rate (2024 or latest year)
    recent = df[df["year"] >= 2022].groupby(["name", "gender"])["rate_per_1k"].mean().reset_index()
    recent_lookup = {}
    for _, row in recent.iterrows():
        recent_lookup[(row["name"], row["gender"])] = round(float(row["rate_per_1k"]), 4)

    # Lifetime births
    lifetime = df.groupby(["name", "gender"])["count"].sum().reset_index()

    index = []
    print(f"  Building index for {len(lifetime):,} name-gender pairs …")
    for _, row in lifetime.iterrows():
        name, gender = row["name"], row["gender"]
        lb = int(row["count"])
        key = (name, gender)

        wave = wave_lookup.get(key, {})
        era = era_lookup.get(name)
        era_label = era_meta.get(str(era), {}).get("label", "Unknown") if era is not None else None

        entry = {
            "name": name,
            "gender": gender,
            "lifetime_births": lb,
            "peak_year": wave.get("peak_year"),
            "peak_rate": wave.get("peak_rate"),
            "half_life": wave.get("half_life"),
            "curve_type": wave.get("curve_type"),
            "era": era_label,
            "current_rate": recent_lookup.get(key, 0),
        }
        index.append(entry)

    # Sort by lifetime births descending
    index.sort(key=lambda x: x["lifetime_births"], reverse=True)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(index, f)

    size_mb = OUT.stat().st_size / 1e6
    print(f"  Saved {OUT} ({size_mb:.1f} MB, {len(index):,} entries)")
    print("  Top 10 by lifetime births:")
    for e in index[:10]:
        print(f"    {e['name']} ({e['gender']}): {e['lifetime_births']:,} births, "
              f"peak {e['peak_year']}, {e['curve_type']}")
    print("07_search_index: done.")


if __name__ == "__main__":
    main()
