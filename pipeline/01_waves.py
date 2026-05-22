"""
01_waves.py — Compute wave-shape metrics for each name with 1000+ lifetime births.

For each qualifying name: peak_year, peak_rate, rise_time, half_life, and
curve_type classification (classic, flash, steady, revival, crossover).
"""

from pathlib import Path
import json
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parent
LONG = ROOT / "data" / "clean" / "names_long.parquet"
OUT = ROOT / "output" / "waves.json"


def classify_curve(row, yearly_rates, name, gender):
    """Classify the shape of a name's popularity curve."""
    rates = yearly_rates.get((name, gender))
    if rates is None or len(rates) == 0:
        return "classic"

    years = np.array(sorted(rates.keys()))
    vals = np.array([rates[y] for y in years])

    # crossover: appears as both genders — handled separately
    # flash: total span above 0.5/1k is < 10 years
    above_half = years[vals > 0.5]
    if len(above_half) > 0:
        span = above_half[-1] - above_half[0] + 1
        if span < 10:
            return "flash"

    # steady: never peaks above 2x its mean
    mean_rate = vals.mean()
    if mean_rate > 0 and vals.max() < 2 * mean_rate:
        return "steady"

    # revival: two distinct peaks (local maxima separated by a valley < 50% of lower peak)
    if len(vals) >= 5:
        from scipy.signal import find_peaks
        peaks_idx, props = find_peaks(vals, prominence=0.3, distance=10)
        if len(peaks_idx) >= 2:
            # Check that the valley between the two highest peaks drops significantly
            sorted_peaks = sorted(peaks_idx, key=lambda i: vals[i], reverse=True)[:2]
            p1, p2 = sorted(sorted_peaks[:2])
            valley = vals[p1:p2+1].min()
            lower_peak = min(vals[p1], vals[p2])
            if lower_peak > 0 and valley < 0.5 * lower_peak:
                return "revival"

    return "classic"


def main():
    print("01_waves: loading long data …")
    df = pd.read_parquet(LONG)

    # Lifetime births per name+gender
    lifetime = df.groupby(["name", "gender"])["count"].sum().reset_index()
    lifetime.rename(columns={"count": "lifetime_births"}, inplace=True)
    qualified = lifetime[lifetime["lifetime_births"] >= 1000].copy()
    print(f"  Names with 1000+ lifetime births: {len(qualified):,}")

    # Build yearly rates lookup
    print("  Building yearly rate lookup …")
    sub = df[df.set_index(["name", "gender"]).index.isin(
        qualified.set_index(["name", "gender"]).index
    )].copy()

    yearly_rates = {}
    for (name, gender), grp in sub.groupby(["name", "gender"]):
        yearly_rates[(name, gender)] = dict(zip(grp["year"], grp["rate_per_1k"]))

    results = []
    print("  Computing wave metrics …")
    for _, row in qualified.iterrows():
        name, gender, lb = row["name"], row["gender"], int(row["lifetime_births"])
        rates = yearly_rates.get((name, gender), {})
        if not rates:
            continue

        years = np.array(sorted(rates.keys()))
        vals = np.array([rates[y] for y in years])

        peak_idx = int(np.argmax(vals))
        peak_year = int(years[peak_idx])
        peak_rate = float(vals[peak_idx])

        # Rise time: first year above 0.1/1k to peak
        above_thresh = years[vals > 0.1]
        if len(above_thresh) > 0:
            rise_time = int(peak_year - above_thresh[0])
        else:
            rise_time = 0

        # Half-life: years from peak until rate drops to half peak
        half_peak = peak_rate / 2
        post_peak = [(y, v) for y, v in zip(years, vals) if y > peak_year and v <= half_peak]
        if post_peak:
            half_life = int(post_peak[0][0] - peak_year)
        else:
            half_life = None  # hasn't decayed to half yet

        curve_type = classify_curve(row, yearly_rates, name, gender)

        results.append({
            "name": name,
            "gender": gender,
            "lifetime_births": lb,
            "peak_year": peak_year,
            "peak_rate": round(peak_rate, 4),
            "rise_time": rise_time,
            "half_life": half_life,
            "curve_type": curve_type,
        })

    # Mark crossover names (appear as both genders)
    name_genders = qualified.groupby("name")["gender"].apply(set).to_dict()
    crossover_names = {n for n, gs in name_genders.items() if len(gs) > 1}
    for r in results:
        if r["name"] in crossover_names:
            r["curve_type"] = "crossover"

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(results, f, indent=2)

    # Stats
    from collections import Counter
    ct = Counter(r["curve_type"] for r in results)
    print(f"  Total wave entries: {len(results):,}")
    print(f"  Curve types: {dict(ct)}")
    print(f"  Saved {OUT}")
    print("01_waves: done.")


if __name__ == "__main__":
    main()
