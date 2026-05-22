"""
05_triggers.py — Measure the impact of known cultural trigger events on names.

For each trigger event, computes pre/post rates and lift factor.
"""

from pathlib import Path
import json
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parent
LONG = ROOT / "data" / "clean" / "names_long.parquet"
OUT = ROOT / "output" / "triggers.json"

# Known cultural trigger events: (name, trigger_year, event_description)
TRIGGERS = [
    ("Shirley", 1935, "Shirley Temple film stardom"),
    ("Jennifer", 1970, "Love Story (film/novel)"),
    ("Diana", 1981, "Royal wedding of Princess Diana"),
    ("Emma", 1994, "Friends character / cultural shift"),
    ("Katrina", 2005, "Hurricane Katrina (negative)"),
    ("Elsa", 2013, "Frozen (Disney film)"),
    ("Arya", 2012, "Game of Thrones (TV)"),
    ("Alexa", 2014, "Amazon Echo / Alexa launch (negative)"),
    ("Khaleesi", 2012, "Game of Thrones (TV)"),
    ("Madison", 1984, "Splash (film)"),
    ("Elvis", 1956, "Elvis Presley breakthrough"),
    ("Miley", 2006, "Hannah Montana (TV)"),
    ("Kanye", 2004, "Kanye West debut album"),
    ("Barack", 2008, "Barack Obama presidential campaign"),
    ("Daenerys", 2012, "Game of Thrones (TV)"),
    ("Renesmee", 2008, "Twilight (film)"),
    ("Nevaeh", 2000, "Sonny Sandoval names daughter on MTV"),
    ("Bentley", 2010, "Teen Mom (TV)"),
]

PRE_WINDOW = 3   # years before trigger
POST_WINDOW = 3  # years after trigger


def main():
    print("05_triggers: loading data …")
    df = pd.read_parquet(LONG)

    # Build lookup: (name) -> {year: rate_per_1k} (sum across genders)
    agg = df.groupby(["name", "year"])["rate_per_1k"].sum().reset_index()
    lookup = {}
    for name, grp in agg.groupby("name"):
        lookup[name] = dict(zip(grp["year"], grp["rate_per_1k"]))

    results = []
    print(f"  Evaluating {len(TRIGGERS)} trigger events …")

    for name, trigger_year, description in TRIGGERS:
        rates = lookup.get(name, {})

        pre_years = range(trigger_year - PRE_WINDOW, trigger_year)
        post_years = range(trigger_year, trigger_year + POST_WINDOW + 1)

        pre_rates = [rates.get(y, 0) for y in pre_years]
        post_rates = [rates.get(y, 0) for y in post_years]

        pre_mean = float(np.mean(pre_rates)) if pre_rates else 0
        post_mean = float(np.mean(post_rates)) if post_rates else 0
        lift = round(post_mean / pre_mean, 2) if pre_mean > 0.001 else None

        # Peak rate and year overall
        if rates:
            peak_year = max(rates, key=rates.get)
            peak_rate = rates[peak_year]
        else:
            peak_year = None
            peak_rate = 0

        results.append({
            "name": name,
            "trigger_year": trigger_year,
            "event": description,
            "pre_mean_rate": round(pre_mean, 4),
            "post_mean_rate": round(post_mean, 4),
            "lift": lift,
            "peak_year": peak_year,
            "peak_rate": round(float(peak_rate), 4) if peak_rate else 0,
            "detected": lift is not None and (lift > 1.5 or lift < 0.67),
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(results, f, indent=2)

    print(f"  Saved {OUT}")
    for r in results:
        tag = "DETECTED" if r["detected"] else "weak/missed"
        lift_str = f"{r['lift']}x" if r['lift'] else "N/A"
        print(f"    {r['name']} ({r['trigger_year']}): lift={lift_str}  [{tag}]")
    print("05_triggers: done.")


if __name__ == "__main__":
    main()
