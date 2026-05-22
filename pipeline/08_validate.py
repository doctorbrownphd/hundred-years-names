"""
08_validate.py — Validate trigger events and era detections against cultural history.

Cross-references detected triggers and era clusters with known facts.
Scores each event as detected or missed.
"""

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
TRIGGERS_FILE = ROOT / "output" / "triggers.json"
ERAS_FILE = ROOT / "output" / "eras.json"
OUT = ROOT / "output" / "validation.json"

# Ground-truth cultural knowledge for validation
KNOWN_FACTS = {
    "Shirley": {"expected_peak_range": (1935, 1940), "direction": "positive"},
    "Jennifer": {"expected_peak_range": (1970, 1985), "direction": "positive"},
    "Diana": {"expected_peak_range": (1981, 1990), "direction": "positive"},
    "Katrina": {"expected_peak_range": (1980, 2000), "direction": "negative_post_2005"},
    "Elsa": {"expected_peak_range": (2013, 2017), "direction": "positive"},
    "Arya": {"expected_peak_range": (2012, 2020), "direction": "positive"},
    "Alexa": {"expected_peak_range": (2006, 2015), "direction": "negative_post_2014"},
    "Madison": {"expected_peak_range": (1997, 2005), "direction": "positive"},
    "Nevaeh": {"expected_peak_range": (2005, 2012), "direction": "positive"},
}

# Expected era structure: we expect distinct clusters for different decades
EXPECTED_ERA_PEAKS = [
    ("Victorian/Turn-of-century", 1880, 1910),
    ("Mid-century", 1940, 1970),
    ("Boomer children", 1960, 1985),
    ("Millennial era", 1985, 2010),
    ("Modern/Post-2010", 2010, 2025),
]


def main():
    print("08_validate: loading outputs …")

    with open(TRIGGERS_FILE) as f:
        triggers = json.load(f)

    with open(ERAS_FILE) as f:
        eras = json.load(f)

    # Validate triggers
    trigger_results = []
    for t in triggers:
        name = t["name"]
        known = KNOWN_FACTS.get(name)
        status = "no_ground_truth"
        notes = ""

        if known:
            peak = t.get("peak_year")
            lo, hi = known["expected_peak_range"]
            if peak and lo <= peak <= hi:
                peak_correct = True
            else:
                peak_correct = False

            if known["direction"].startswith("negative"):
                # For negative events, lift < 1 is a detection
                detected = t.get("lift") is not None and t["lift"] < 0.67
            else:
                detected = t.get("detected", False)

            if detected and peak_correct:
                status = "detected_correct"
            elif detected:
                status = "detected_peak_off"
            elif peak_correct:
                status = "peak_correct_lift_weak"
            else:
                status = "missed"

            notes = (f"expected peak {lo}-{hi}, got {peak}; "
                     f"lift={t.get('lift')}, direction={known['direction']}")
        else:
            if t.get("detected"):
                status = "detected_unvalidated"

        trigger_results.append({
            "name": name,
            "event": t["event"],
            "trigger_year": t["trigger_year"],
            "status": status,
            "lift": t.get("lift"),
            "peak_year": t.get("peak_year"),
            "notes": notes,
        })

    # Validate eras
    era_meta = eras["eras"]
    era_results = []
    matched_periods = set()

    for cid, meta in era_meta.items():
        mp = meta["median_peak_year"]
        matched = None
        for label, lo, hi in EXPECTED_ERA_PEAKS:
            if lo <= mp <= hi and label not in matched_periods:
                matched = label
                matched_periods.add(label)
                break
        era_results.append({
            "cluster_id": int(cid),
            "label": meta["label"],
            "median_peak_year": mp,
            "size": meta["size"],
            "matched_period": matched or "unexpected/novel",
        })

    # Summary scores
    n_triggers = len([t for t in trigger_results if t["notes"]])
    n_detected = len([t for t in trigger_results
                      if t["status"] in ("detected_correct", "detected_peak_off")])
    n_eras_matched = len([e for e in era_results if e["matched_period"] != "unexpected/novel"])

    validation = {
        "trigger_validation": trigger_results,
        "era_validation": era_results,
        "summary": {
            "triggers_with_ground_truth": n_triggers,
            "triggers_detected": n_detected,
            "trigger_detection_rate": round(n_detected / n_triggers, 2) if n_triggers > 0 else 0,
            "era_clusters": len(era_results),
            "eras_matched_to_known_periods": n_eras_matched,
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(validation, f, indent=2)

    print(f"  Saved {OUT}")
    print(f"\n  Trigger detection: {n_detected}/{n_triggers} "
          f"({validation['summary']['trigger_detection_rate']:.0%})")
    for t in trigger_results:
        if t["notes"]:
            print(f"    {t['name']}: {t['status']}")
    print(f"\n  Era matching: {n_eras_matched}/{len(era_results)} clusters matched known periods")
    for e in era_results:
        print(f"    Cluster {e['cluster_id']} (peak ~{e['median_peak_year']}): {e['matched_period']}")
    print("08_validate: done.")


if __name__ == "__main__":
    main()
