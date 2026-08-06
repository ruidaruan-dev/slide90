#!/usr/bin/env python3
"""Validate a Slide90-style executive deck specification before rendering."""

from __future__ import annotations

import json
import sys
from pathlib import Path


LAYOUT_LIMITS = {
    "performance-dashboard": {"metrics": 5, "blocks": 4},
    "evidence-matrix": {"metrics": 5, "blocks": 4},
    "diagnosis-tree": {"blocks": 3},
    "roadmap": {"blocks": 3},
    "capability-loop": {"blocks": 6},
    "portfolio-table": {"blocks": 8},
    "comparison-matrix": {"blocks": 5},
    "decision-page": {"blocks": 3},
}

GENERIC_TITLES = {
    "项目介绍",
    "工作汇报",
    "能力介绍",
    "未来规划",
    "项目进展",
    "executive summary",
    "project update",
    "overview",
}


def text_length(value: object) -> int:
    return len(str(value or "").strip())


def validate_slide(slide: object, index: int) -> list[dict[str, object]]:
    issues: list[dict[str, object]] = []
    location = f"slides[{index}]"
    if not isinstance(slide, dict):
        return [{"location": location, "type": "invalid-slide", "message": "Slide must be an object."}]

    title = str(slide.get("title", "")).strip()
    layout = str(slide.get("layout", "")).strip()
    conclusion = str(slide.get("conclusion", "")).strip()

    if not title:
        issues.append({"location": f"{location}.title", "type": "missing-title", "message": "Add a conclusion-led title."})
    elif title.lower() in GENERIC_TITLES or title in GENERIC_TITLES:
        issues.append({"location": f"{location}.title", "type": "generic-title", "message": "Replace the topic label with a decision statement."})
    elif text_length(title) > 68:
        issues.append({"location": f"{location}.title", "type": "long-title", "message": "Keep the title within 68 characters or approximately 34 Chinese characters."})

    if layout not in LAYOUT_LIMITS:
        issues.append({"location": f"{location}.layout", "type": "invalid-layout", "message": f"Use one of: {', '.join(LAYOUT_LIMITS)}."})
        return issues

    limits = LAYOUT_LIMITS[layout]
    metrics = slide.get("metrics", []) or []
    blocks = slide.get("blocks", []) or []

    if not isinstance(metrics, list):
        issues.append({"location": f"{location}.metrics", "type": "invalid-metrics", "message": "Metrics must be a list."})
        metrics = []
    if not isinstance(blocks, list):
        issues.append({"location": f"{location}.blocks", "type": "invalid-blocks", "message": "Blocks must be a list."})
        blocks = []

    if len(metrics) > limits.get("metrics", 0):
        issues.append({"location": f"{location}.metrics", "type": "excess-metrics", "message": f"Use at most {limits.get('metrics', 0)} metrics for {layout}."})
    if len(blocks) > limits["blocks"]:
        issues.append({"location": f"{location}.blocks", "type": "excess-blocks", "message": f"Use at most {limits['blocks']} blocks for {layout}."})

    for block_index, block in enumerate(blocks):
        block_location = f"{location}.blocks[{block_index}]"
        if not isinstance(block, dict):
            issues.append({"location": block_location, "type": "invalid-block", "message": "Block must be an object."})
            continue
        if not str(block.get("id", "")).strip():
            issues.append({"location": f"{block_location}.id", "type": "missing-id", "message": "Add a stable element ID for targeted repair."})
        body_length = text_length(block.get("body"))
        if body_length > 90:
            issues.append({"location": f"{block_location}.body", "type": "dense-body", "message": "Compress the block body to 90 characters or fewer."})
        if layout in {"evidence-matrix", "performance-dashboard"} and not str(block.get("evidence", "")).strip():
            issues.append({"location": f"{block_location}.evidence", "type": "missing-evidence", "message": "Add direct evidence or a measurable result."})

    if layout not in {"portfolio-table"} and not conclusion:
        issues.append({"location": f"{location}.conclusion", "type": "missing-conclusion", "message": "Add the decision, target state, or management implication."})

    return issues


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: validate_deck_spec.py <deck-spec.json>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "error", "issues": [{"type": "invalid-json", "message": str(exc)}]}, ensure_ascii=False, indent=2))
        return 2

    slides = data.get("slides", []) if isinstance(data, dict) else []
    issues: list[dict[str, object]] = []
    if not isinstance(slides, list) or not slides:
        issues.append({"location": "slides", "type": "missing-slides", "message": "Add at least one slide."})
    else:
        for index, slide in enumerate(slides):
            issues.extend(validate_slide(slide, index))

    result = {"status": "pass" if not issues else "fail", "slide_count": len(slides) if isinstance(slides, list) else 0, "issue_count": len(issues), "issues": issues}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not issues else 1


if __name__ == "__main__":
    raise SystemExit(main())
