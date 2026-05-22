"""
04_gender.py — Find gender-crossing names and compute crossover metrics.

Identifies names used for both M and F, finds the crossover year (when
minority gender exceeded 30% of total), and computes current ratio.
"""

from pathlib import Path
import json
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parent
LONG = ROOT / "data" / "clean" / "names_long.parquet"
OUT = ROOT / "output" / "gender_cross.json"


def main():
    print("04_gender: loading data …")
    df = pd.read_parquet(LONG)

    # Find names that appear as both M and F
    name_genders = df.groupby("name")["gender"].apply(set)
    cross_names = name_genders[name_genders.apply(len) > 1].index.tolist()
    print(f"  Names appearing as both M and F: {len(cross_names):,}")

    # Focus on those with meaningful usage in both genders (100+ in each)
    gender_totals = df[df["name"].isin(cross_names)].groupby(
        ["name", "gender"]
    )["count"].sum().unstack(fill_value=0)

    qualified = gender_totals[
        (gender_totals.get("M", 0) >= 100) & (gender_totals.get("F", 0) >= 100)
    ]
    print(f"  With 100+ births in each gender: {len(qualified):,}")

    results = []
    sub = df[df["name"].isin(qualified.index)].copy()

    for name in qualified.index:
        ndf = sub[sub["name"] == name]
        yearly = ndf.pivot_table(index="year", columns="gender", values="count", aggfunc="sum").fillna(0)

        if "M" not in yearly.columns or "F" not in yearly.columns:
            continue

        total_m = int(yearly["M"].sum())
        total_f = int(yearly["F"].sum())
        majority_gender = "M" if total_m >= total_f else "F"
        minority_gender = "F" if majority_gender == "M" else "M"

        # Find crossover year: first year minority > 30% of year total
        yearly["total"] = yearly["M"] + yearly["F"]
        yearly["minority_share"] = yearly[minority_gender] / yearly["total"]
        yearly["minority_share"] = yearly["minority_share"].fillna(0)

        crossover_rows = yearly[yearly["minority_share"] > 0.3]
        crossover_year = int(crossover_rows.index.min()) if len(crossover_rows) > 0 else None

        # Current ratio (most recent 5 years)
        recent = yearly[yearly.index >= 2020]
        if len(recent) > 0:
            rm = recent["M"].sum()
            rf = recent["F"].sum()
            current_ratio_mf = round(float(rm / (rm + rf)), 4) if (rm + rf) > 0 else 0.5
        else:
            current_ratio_mf = None

        results.append({
            "name": name,
            "total_m": total_m,
            "total_f": total_f,
            "majority_gender": majority_gender,
            "crossover_year": crossover_year,
            "current_male_share": current_ratio_mf,
        })

    results.sort(key=lambda r: (r["total_m"] + r["total_f"]), reverse=True)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(results, f, indent=2)

    print(f"  Saved {OUT} ({len(results)} names)")
    for r in results[:10]:
        cx = r["crossover_year"] or "never"
        print(f"    {r['name']}: M={r['total_m']:,} F={r['total_f']:,} crossover={cx}")
    print("04_gender: done.")


if __name__ == "__main__":
    main()
