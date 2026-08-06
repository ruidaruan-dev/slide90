# Fast Loop

Use this protocol for decks of 2–12 slides. Separate judgment from execution: let the agent decide the storyline and layout IDs once; let deterministic coordinates and validation handle repeated production work.

## Batch specification

Create one JSON object before drawing shapes:

```json
{
  "version": "1.0",
  "deck_title": "Q3 management update",
  "audience": "executive committee",
  "decision": "Approve the Q4 scale-up plan",
  "slides": [
    {
      "number": 1,
      "section": "01 / Executive summary",
      "title": "Three results confirm readiness to scale in Q4",
      "layout": "performance-dashboard",
      "subtitle": "Delivery, adoption and value evidence point to the same conclusion",
      "metrics": [
        {"value": "7", "label": "departments"},
        {"value": "20+", "label": "validated demands"}
      ],
      "blocks": [
        {"id": "result-1", "title": "Delivery", "body": "Five initiatives launched", "evidence": "Accepted by business owners"}
      ],
      "conclusion": "Decision required: approve the next scale-up cohort",
      "source_refs": ["report.docx#section-2"]
    }
  ]
}
```

Keep the specification as the single factual source during rendering and repair. Never re-extract source material merely to fix a visual problem.

## Layout IDs

Use only these IDs unless the platform provides another tested template:

- `performance-dashboard`
- `evidence-matrix`
- `diagnosis-tree`
- `roadmap`
- `capability-loop`
- `portfolio-table`
- `comparison-matrix`
- `decision-page`

Read `assets/layout-specs.json` for exact content zones. Treat the coordinates as stable defaults, not suggestions.

## Two-gate loop

### Gate 1: structural validation

Run before PowerPoint rendering:

```bash
python scripts/validate_deck_spec.py deck-spec.json
```

Fix only the reported field. Typical failures include an invalid layout ID, generic or overlong title, excessive blocks, excessive card text, absent evidence, or missing conclusion.

### Gate 2: visual validation

Render the complete deck once. Check overflow, clipping, overlap, alignment, font substitution, reading order, contrast, and readability at 70% scale.

Create a repair list in this form:

```json
[
  {"slide": 3, "element": "evidence-2", "issue": "text-overflow", "action": "compress-text"},
  {"slide": 5, "element": "conclusion", "issue": "weak-contrast", "action": "apply-navy-strip"}
]
```

Lock all slides not present in the repair list. Rerender only the affected slides when the platform permits it. Use at most two repair passes by default.

## Repair order

Use the cheapest valid repair first:

1. remove repeated or non-decision text;
2. compress the sentence;
3. reduce spacing within the defined safe range;
4. switch to a lower-density layout;
5. split the slide;
6. reduce font size, but never below 11 pt.

Do not move unrelated elements when repairing one block.

## Fast versus thorough mode

- **Fast mode:** one structural validation, one full render, up to one targeted repair pass. Use for internal drafts and decks of 2–12 slides.
- **Thorough mode:** one structural validation, one full render, up to two targeted repair passes. Use for board, investor, promotion, or external presentations.

Default to Fast mode unless the audience or user request clearly requires Thorough mode.
