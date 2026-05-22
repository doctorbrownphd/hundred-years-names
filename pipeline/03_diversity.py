"""
03_diversity.py — Compute yearly name-diversity metrics.

Per year: Shannon entropy, top-10 share, top-50 share, unique name count, HHI.
"""

from pathlib import Path
import json
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parent
LONG = ROOT / "data" / "clean" / "names_long.parquet"
OUT = ROOT / "output" / "diversity.json"


def shannon_entropy(counts):
    """Compute Shannon entropy in bits from a count array."""
    total = counts.sum()
    if total == 0:
        return 0.0
    p = counts / total
    p = p[p > 0]
    return float(-np.sum(p * np.log2(p)))


def hhi(counts):
    """Herfindahl-Hirschman Index from count array."""
    total = counts.sum()
    if total == 0:
        return 0.0
    shares = counts / total
    return float(np.sum(shares ** 2))


def main():
    print("03_diversity: loading data …")
    df = pd.read_parquet(LONG)

    results = []
    years = sorted(df["year"].unique())
    print(f"  Computing diversity for {len(years)} years …")

    for year in years:
        ydf = df[df["year"] == year].copy()
        counts = ydf["count"].values
        total = counts.sum()
        unique = len(counts)

        # Top-N shares
        sorted_counts = np.sort(counts)[::-1]
        top10_share = float(sorted_counts[:10].sum() / total) if total > 0 else 0
        top50_share = float(sorted_counts[:50].sum() / total) if total > 0 else 0

        results.append({
            "year": int(year),
            "total_births": int(total),
            "unique_names": int(unique),
            "shannon_entropy": round(shannon_entropy(counts), 4),
            "hhi": round(hhi(counts), 6),
            "top10_share": round(top10_share, 4),
            "top50_share": round(top50_share, 4),
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(results, f, indent=2)

    print(f"  Saved {OUT}")
    # Print a few milestones
    for r in results:
        if r["year"] in [1880, 1920, 1960, 2000, 2024]:
            print(f"    {r['year']}: entropy={r['shannon_entropy']:.2f}, "
                  f"unique={r['unique_names']:,}, top10={r['top10_share']:.1%}, "
                  f"HHI={r['hhi']:.6f}")
    print("03_diversity: done.")


if __name__ == "__main__":
    main()
