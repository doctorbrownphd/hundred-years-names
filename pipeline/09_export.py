"""
09_export.py — Combine all outputs into a final meta.json with headline stats.
"""

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "output"
OUT = OUTPUT / "meta.json"


def load_json(name):
    path = OUTPUT / name
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return None


def main():
    print("09_export: combining all outputs …")

    waves = load_json("waves.json") or []
    eras = load_json("eras.json") or {}
    diversity = load_json("diversity.json") or []
    gender = load_json("gender_cross.json") or []
    triggers = load_json("triggers.json") or []
    cowaves = load_json("cowaves.json") or []
    search_index = load_json("search_index.json") or []
    validation = load_json("validation.json") or {}
    heatmap = load_json("heatmap.json") or {}

    # Curve type distribution
    from collections import Counter
    curve_types = Counter(w["curve_type"] for w in waves)

    # Diversity endpoints
    if diversity:
        d_first = diversity[0]
        d_last = diversity[-1]
    else:
        d_first = d_last = {}

    meta = {
        "project": "One Hundred Years of American Names",
        "year_range": [1880, 2024],
        "total_years": 145,
        "total_unique_names": len(set(e["name"] for e in search_index)) if search_index else 0,
        "total_name_gender_pairs": len(search_index),
        "names_with_wave_analysis": len(waves),
        "curve_type_distribution": dict(curve_types),
        "era_clusters": eras.get("n_clusters", 0),
        "gender_crossing_names": len(gender),
        "cultural_triggers_tested": len(triggers),
        "triggers_detected": len([t for t in triggers if t.get("detected")]),
        "cowave_groups": len(cowaves),
        "diversity_trend": {
            "entropy_1880": d_first.get("shannon_entropy"),
            "entropy_2024": d_last.get("shannon_entropy"),
            "unique_names_1880": d_first.get("unique_names"),
            "unique_names_2024": d_last.get("unique_names"),
            "top10_share_1880": d_first.get("top10_share"),
            "top10_share_2024": d_last.get("top10_share"),
        },
        "validation_summary": validation.get("summary", {}),
        "output_files": [
            "waves.json",
            "eras.json",
            "heatmap.json",
            "diversity.json",
            "gender_cross.json",
            "triggers.json",
            "cowaves.json",
            "search_index.json",
            "validation.json",
            "meta.json",
        ],
    }

    with open(OUT, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"  Saved {OUT}")
    print("\n  === HEADLINE STATS ===")
    print(f"  Year range: {meta['year_range'][0]}–{meta['year_range'][1]} ({meta['total_years']} years)")
    print(f"  Unique names: {meta['total_unique_names']:,}")
    print(f"  Name-gender pairs: {meta['total_name_gender_pairs']:,}")
    print(f"  Wave analyses: {meta['names_with_wave_analysis']:,}")
    print(f"  Curve types: {dict(curve_types)}")
    print(f"  Era clusters: {meta['era_clusters']}")
    print(f"  Gender-crossing names: {meta['gender_crossing_names']:,}")
    print(f"  Cultural triggers detected: {meta['triggers_detected']}/{meta['cultural_triggers_tested']}")
    print(f"  Co-wave groups: {meta['cowave_groups']}")
    dt = meta["diversity_trend"]
    print(f"  Entropy: {dt['entropy_1880']} (1880) -> {dt['entropy_2024']} (2024)")
    print(f"  Unique names: {dt['unique_names_1880']:,} (1880) -> {dt['unique_names_2024']:,} (2024)")
    print(f"  Top-10 share: {dt['top10_share_1880']:.1%} (1880) -> {dt['top10_share_2024']:.1%} (2024)")
    print("09_export: done.")


if __name__ == "__main__":
    main()
