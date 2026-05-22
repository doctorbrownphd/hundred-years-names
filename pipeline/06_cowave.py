"""
06_cowave.py — Find co-waves: groups of names that inflect upward together.

Computes pairwise correlation of year-over-year rate changes for names
with 5000+ lifetime births, then clusters correlated names.
"""

from pathlib import Path
import json
import pandas as pd
import numpy as np
from scipy.cluster.hierarchy import fcluster, linkage
from scipy.spatial.distance import squareform

ROOT = Path(__file__).resolve().parent
LONG = ROOT / "data" / "clean" / "names_long.parquet"
OUT = ROOT / "output" / "cowaves.json"

YEARS = list(range(1880, 2025))


def main():
    print("06_cowave: loading data …")
    df = pd.read_parquet(LONG)

    # Use names with 5000+ lifetime births for manageable computation
    lifetime = df.groupby("name")["count"].sum()
    big_names = lifetime[lifetime >= 5000].index.tolist()
    print(f"  Names with 5000+ births: {len(big_names)}")

    # Aggregate rates across genders
    sub = df[df["name"].isin(big_names)]
    agg = sub.groupby(["name", "year"])["rate_per_1k"].sum().reset_index()
    pivot = agg.pivot(index="name", columns="year", values="rate_per_1k").reindex(columns=YEARS).fillna(0)
    names_list = list(pivot.index)
    print(f"  Pivot shape: {pivot.shape}")

    # Year-over-year rate change (diff)
    diffs = pivot.diff(axis=1).iloc[:, 1:]  # drop first NaN column
    diffs = diffs.fillna(0)

    # Pairwise correlation
    print("  Computing pairwise correlations …")
    corr = np.corrcoef(diffs.values)
    corr = np.nan_to_num(corr, nan=0.0)

    # Convert correlation to distance
    dist = 1 - corr
    np.fill_diagonal(dist, 0)
    dist = np.maximum(dist, 0)  # ensure non-negative
    dist = (dist + dist.T) / 2  # ensure symmetric

    # Hierarchical clustering
    print("  Clustering …")
    condensed = squareform(dist, checks=False)
    Z = linkage(condensed, method="average")
    cluster_labels = fcluster(Z, t=0.6, criterion="distance")

    # Build co-wave groups
    from collections import defaultdict
    groups = defaultdict(list)
    for i, label in enumerate(cluster_labels):
        groups[int(label)].append(names_list[i])

    # Filter to groups of size >= 3
    cowaves = []
    for gid, members in sorted(groups.items()):
        if len(members) >= 3:
            # Find the inflection window: median year of max positive diff
            member_peak_change_years = []
            for name in members:
                row = diffs.loc[name].values
                peak_idx = int(np.argmax(row))
                member_peak_change_years.append(YEARS[peak_idx + 1])  # +1 because diff shifted
            median_inflection = int(np.median(member_peak_change_years))

            cowaves.append({
                "cowave_id": gid,
                "size": len(members),
                "median_inflection_year": median_inflection,
                "names": sorted(members),
            })

    cowaves.sort(key=lambda c: c["median_inflection_year"])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(cowaves, f, indent=2)

    print(f"  Saved {OUT}")
    print(f"  Co-wave groups (size >= 3): {len(cowaves)}")
    for cw in cowaves[:10]:
        sample = ", ".join(cw["names"][:5])
        print(f"    Cowave {cw['cowave_id']}: n={cw['size']}, ~{cw['median_inflection_year']}, "
              f"e.g. {sample}")
    print("06_cowave: done.")


if __name__ == "__main__":
    main()
