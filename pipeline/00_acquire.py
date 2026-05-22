"""
00_acquire.py — Read raw parquet, reshape wide-to-long, compute rate_per_1k.

Reads the wide-format SSA names data and produces a long-format parquet with
columns: name, gender, year, count, rate_per_1k.
"""

from pathlib import Path
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "data" / "raw" / "data" / "train-00000-of-00001.parquet"
OUT = ROOT / "data" / "clean" / "names_long.parquet"

def main():
    print("00_acquire: reading raw parquet …")
    df = pd.read_parquet(RAW)
    print(f"  Raw shape: {df.shape}")

    # Identify year columns (1880–2024)
    year_cols = [c for c in df.columns if c.isdigit()]
    year_cols = sorted(year_cols, key=int)
    print(f"  Year columns: {year_cols[0]}–{year_cols[-1]} ({len(year_cols)} years)")

    # Melt wide to long
    print("  Melting to long format …")
    long = df.melt(
        id_vars=["name", "gender"],
        value_vars=year_cols,
        var_name="year",
        value_name="count",
    )
    long["year"] = long["year"].astype(int)
    long["count"] = long["count"].fillna(0).astype(int)

    # Drop zero rows to save space
    long = long[long["count"] > 0].copy()
    long.sort_values(["year", "name", "gender"], inplace=True)
    long.reset_index(drop=True, inplace=True)
    print(f"  Long shape (non-zero): {long.shape}")

    # Total births per year
    total_by_year = long.groupby("year")["count"].sum()
    print("  Total births per year (sample):")
    for y in [1880, 1920, 1960, 2000, 2024]:
        if y in total_by_year.index:
            print(f"    {y}: {total_by_year[y]:,.0f}")

    # Rate per 1k births
    long = long.merge(
        total_by_year.rename("total_births").reset_index(),
        on="year",
    )
    long["rate_per_1k"] = long["count"] / long["total_births"] * 1000
    long.drop(columns=["total_births"], inplace=True)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    long.to_parquet(OUT, index=False)
    print(f"  Saved {OUT}  ({OUT.stat().st_size / 1e6:.1f} MB)")

    # Summary stats
    print(f"\n  Unique names:   {long['name'].nunique():,}")
    print(f"  Year range:     {long['year'].min()}–{long['year'].max()}")
    print(f"  Total rows:     {len(long):,}")
    print("00_acquire: done.")

if __name__ == "__main__":
    main()
