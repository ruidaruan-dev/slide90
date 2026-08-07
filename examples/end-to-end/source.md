# Synthetic source notes: Slide90 P0 release

Audience: open-source maintainers and potential contributors.

Decision needed: accept P0 as the first executable foundation and use its contract for future layouts.

Public facts available in this repository:

- One formal JSON Schema defines the planner-to-renderer contract.
- One CLI exposes validation and rendering as stable commands.
- Two flagship layouts render as editable PowerPoint shapes and text.
- Four Node tests cover schema failures and PPTX package generation.
- One end-to-end fixture preserves the path from source notes to deck spec, PPTX, and PNG preview.
- The QA loop includes office rendering, overflow checks, independent PPTX import, and a reproducible benchmark.
- A sustainable contributor loop needs issue reporters, layout contributors, spec maintainers, renderer maintainers, QA maintainers, and release maintainers.

This fixture describes only the public Slide90 repository and contains no company, customer, staffing, or financial information.
