"""
02_eras.py — Cluster top-500 names into cultural eras via HDBSCAN.

Builds a 145-dim rate vector per name, normalizes to unit length,
clusters with HDBSCAN, and labels eras by median peak year.
Also produces heatmap data for the top 60 names by decade.
"""

from pathlib import Path
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import normalize
import hdbscan

ROOT = Path(__file__).resolve().parent
LONG = ROOT / "data" / "clean" / "names_long.parquet"
OUT_ERAS = ROOT / "output" / "eras.json"
OUT_HEATMAP = ROOT / "output" / "heatmap.json"

YEARS = list(range(1880, 2025))


def main():
    print("02_eras: loading data …")
    df = pd.read_parquet(LONG)

    # Top 500 names by lifetime births (combine genders)
    lifetime = df.groupby("name")["count"].sum().nlargest(500)
    top_names = list(lifetime.index)
    print(f"  Top 500 names selected (max births: {lifetime.iloc[0]:,})")

    sub = df[df["name"].isin(top_names)].copy()
    # Aggregate across genders for era detection
    agg = sub.groupby(["name", "year"])["rate_per_1k"].sum().reset_index()

    # Pivot to wide: name x year
    pivot = agg.pivot(index="name", columns="year", values="rate_per_1k").reindex(columns=YEARS).fillna(0)
    names_list = list(pivot.index)

    # Normalize to unit vectors
    X = pivot.values.astype(np.float64)
    X_norm = normalize(X, norm="l2")

    # Cluster with HDBSCAN
    print("  Clustering with HDBSCAN …")
    clusterer = hdbscan.HDBSCAN(min_cluster_size=30, min_samples=5, metric="euclidean")
    labels = clusterer.fit_predict(X_norm)

    n_clusters = len(set(labels) - {-1})
    n_noise = (labels == -1).sum()
    print(f"  Clusters found: {n_clusters}, noise points: {n_noise}")

    # Build era metadata
    era_assignments = []
    for i, name in enumerate(names_list):
        era_assignments.append({
            "name": name,
            "cluster": int(labels[i]),
            "lifetime_births": int(lifetime[name]),
        })

    # Label eras by median peak year
    peak_years = {}
    for i, name in enumerate(names_list):
        row = pivot.loc[name].values
        peak_years[name] = YEARS[int(np.argmax(row))]

    era_meta = {}
    for cid in sorted(set(labels)):
        members = [names_list[i] for i in range(len(names_list)) if labels[i] == cid]
        median_peak = int(np.median([peak_years[n] for n in members]))
        era_meta[str(cid)] = {
            "label": f"Era {cid}" if cid >= 0 else "Unclassified",
            "median_peak_year": median_peak,
            "size": len(members),
            "sample_names": members[:8],
        }

    eras_output = {
        "assignments": era_assignments,
        "eras": era_meta,
        "n_clusters": n_clusters,
    }

    OUT_ERAS.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_ERAS, "w") as f:
        json.dump(eras_output, f, indent=2)
    print(f"  Saved {OUT_ERAS}")

    # Heatmap: top 60 names, per-decade rates, sorted by peak decade
    print("  Building heatmap data …")
    top60 = list(lifetime.head(60).index)
    decades = list(range(1880, 2030, 10))
    decade_labels = [f"{d}s" for d in decades]

    heatmap_rows = []
    for name in top60:
        row_data = pivot.loc[name].values
        decade_rates = []
        for d in decades:
            yrs_in_decade = [y - 1880 for y in range(d, min(d + 10, 2025))]
            decade_rates.append(round(float(np.mean(row_data[yrs_in_decade])), 4))
        peak_decade = decades[int(np.argmax(decade_rates))]
        heatmap_rows.append({
            "name": name,
            "peak_decade": peak_decade,
            "decade_rates": dict(zip(decade_labels, decade_rates)),
        })

    heatmap_rows.sort(key=lambda r: r["peak_decade"])

    with open(OUT_HEATMAP, "w") as f:
        json.dump({"decades": decade_labels, "names": heatmap_rows}, f, indent=2)
    print(f"  Saved {OUT_HEATMAP}")

    for cid, meta in sorted(era_meta.items(), key=lambda x: x[1]["median_peak_year"]):
        print(f"    Cluster {cid}: peak ~{meta['median_peak_year']}, "
              f"n={meta['size']}, e.g. {', '.join(meta['sample_names'][:4])}")

    print("02_eras: done.")


if __name__ == "__main__":
    main()
