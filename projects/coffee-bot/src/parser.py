import csv
import json
import re
from pathlib import Path

DRINK_KEYWORDS = {
    "latte": "Latte",
    "flat white": "Flat White",
    "americano": "Americano",
    "cappuccino": "Cappuccino",
    "matcha": "Matcha Latte",
    "mocha": "Mocha",
    "espresso": "Espresso",
}

MILK_KEYWORDS = {
    "whole": "Whole Milk",
    "full fat": "Whole Milk",
    "semi": "Semi-Skimmed Milk",
    "skim": "Skimmed Milk",
    "oat": "Oat Milk",
    "almond": "Almond Milk",
    "soy": "Soy Milk",
    "soya": "Soy Milk",
    "coconut": "Coconut Milk",
}

SIZE_KEYWORDS = {
    "small": "Small",
    "medium": "Medium",
    "large": "Large",
    "regular": "Medium",
}

DEFAULT_SIZE = "Large"
DEFAULT_MILK = "Whole Milk"


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def detect_drink(text: str):
    hits = [v for k, v in DRINK_KEYWORDS.items() if k in text]
    if not hits:
        return None, 0.0
    # If multiple drinks hit, ambiguous
    if len(set(hits)) > 1:
        return "/".join(sorted(set(hits))), 0.35
    return hits[0], 0.85


def detect_milk(text: str):
    for k, v in MILK_KEYWORDS.items():
        if k in text:
            return v, False
    return DEFAULT_MILK, True


def detect_size(text: str):
    for k, v in SIZE_KEYWORDS.items():
        if k in text:
            return v, False
    return DEFAULT_SIZE, True


def parse_row(row):
    name = (row.get("name") or "").strip()
    raw = row.get("order_text") or ""
    qty = row.get("qty") or "1"
    text = normalize_text(raw)

    drink, drink_conf = detect_drink(text)
    size, size_defaulted = detect_size(text)
    milk, milk_defaulted = detect_milk(text)

    clarification_needed = False
    reason = ""

    if not text:
        clarification_needed = True
        reason = "blank_order"
        drink = "UNKNOWN"
        drink_conf = 0.0
    elif drink is None:
        clarification_needed = True
        reason = "no_drink_detected"
        drink = "UNKNOWN"
        drink_conf = 0.2
    elif "/" in drink:
        clarification_needed = True
        reason = "multiple_drink_candidates"

    confidence = round(min(0.99, drink_conf + (0.07 if not size_defaulted else 0) + (0.07 if not milk_defaulted else 0)), 2)

    return {
        "name": name,
        "raw_order_text": raw,
        "quantity": int(qty) if str(qty).isdigit() else 1,
        "drink": drink,
        "size": size,
        "milk": milk,
        "defaults_applied": {
            "size": size_defaulted,
            "milk": milk_defaulted,
        },
        "confidence": confidence,
        "clarification_needed": clarification_needed,
        "clarification_reason": reason,
    }


def run(input_csv: Path, output_json: Path):
    rows = []
    with input_csv.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(parse_row(row))

    summary = {
        "total_orders": len(rows),
        "clarification_count": sum(1 for r in rows if r["clarification_needed"]),
        "auto_default_size_count": sum(1 for r in rows if r["defaults_applied"]["size"]),
        "auto_default_milk_count": sum(1 for r in rows if r["defaults_applied"]["milk"]),
    }

    payload = {"summary": summary, "orders": rows}
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Parsed {summary['total_orders']} rows -> {output_json}")
    print(f"Clarifications needed: {summary['clarification_count']}")


if __name__ == "__main__":
    base = Path(__file__).resolve().parents[1]
    input_csv = base / "samples" / "blank_street_orders_sample.csv"
    output_json = base / "output" / "parsed_orders.json"
    run(input_csv, output_json)
