---
name: build-executive-report-slides
description: "Create or redesign executive-facing corporate presentation slides in a compact McKinsey-style visual system, using a fast batch loop that plans the full deck once, applies tested layout coordinates, validates structure before rendering, locks passing slides, and repairs only failed elements. Use for PPT/PPTX/slide requests involving management reports, business reviews, project updates, strategy, transformation, organization design, role-fit evidence, performance analysis, roadmaps, operating models, or when the user asks to reproduce the bundled reference-slide style on ChatGPT, WorkBuddy, or another agentic platform."
---

# Build Executive Report Slides

Create sober, high-density executive slides that remain readable on a meeting-room screen. Preserve the user's facts while turning lists into a visible argument.

## Operating mode

Use **Fast Loop** by default for decks of 2–12 slides. Plan the complete deck once, render it as one batch, lock every slide that passes QA, and repair only failed slides or elements. Never restart the whole deck because one slide fails.

For an installed local runtime, keep the complete planning-to-delivery loop within 10 minutes. Use the phase budgets in [references/fast-loop.md](references/fast-loop.md); exclude only first-time dependency installation, model queueing, network transfer, and source approval delays.

Use the single-slide workflow only when the user requests one page. Read [references/fast-loop.md](references/fast-loop.md) for the batch specification, validation commands, and repair protocol.

## Fast Loop workflow

1. Extract the deck-level decision, audience, storyline, factual constraints, and strongest evidence once for the complete deck.
2. Create one structured deck specification before drawing any shapes. Give every slide a conclusion-led title, layout ID, evidence blocks, source references, and conclusion. Use the schema in [references/fast-loop.md](references/fast-loop.md).
3. Read [references/layout-library.md](references/layout-library.md) once and select one primary layout per slide. For the two canonical layouts:
   - For “能力要求—内部证据—匹配判断”, read [references/evidence-matrix.md](references/evidence-matrix.md).
   - For “业务角色—内部团队—交付闭环—反馈迭代”, read [references/capability-loop.md](references/capability-loop.md).
   - For a hybrid page, use one layout as the main structure and borrow at most one secondary device from another layout.
4. Rewrite vague language using [references/content-compression.md](references/content-compression.md). Validate the complete specification before rendering when scripts can run:
   `node bin/slide90.mjs validate deck-spec.json`
5. Render all slides in one batch. Apply [assets/design-tokens.json](assets/design-tokens.json) and the exact coordinate zones in [assets/layout-specs.json](assets/layout-specs.json). Produce editable shapes and text; do not flatten the full slide into one image.
   For `evidence-matrix` and `capability-loop`, the P0 renderer can create an editable PowerPoint directly:
   `node bin/slide90.mjs render deck-spec.json --output deck.pptx`
6. Render the complete deck once and inspect it at normal presentation size. Record failures by slide number and element ID.
7. Lock passing slides. Repair only the failed text, element, or slide, then rerender only affected slides when the platform permits it. Stop after two repair passes unless the user explicitly requests exhaustive refinement.

## Performance guards

- Do not plan, generate, render, and approve one slide before starting the next. Plan first; generate second; validate third.
- Do not reread the same reference file for every slide.
- Do not redraw passed slides during a repair pass.
- Do not ask the model to calculate stable coordinates when `assets/layout-specs.json` already defines them.
- Do not use visual rendering to discover errors that the structural validator can catch first.
- Preserve the user's facts and source mapping in the deck specification so repairs do not trigger renewed source analysis.

## Non-negotiable rules

- Use one governing thought per slide.
- Use the title as the main conclusion; never use a generic title such as “能力介绍” when a decision statement is possible.
- Prefer evidence to adjectives. Replace “经验丰富” with an internal project, metric, user count, value result, or operating mechanism.
- Use a strict grid. Align every card edge, baseline, column, and divider.
- Keep the background white. Use pale fills only to define groups or evidence bands.
- Use navy for structure, blue/green/purple for functional distinction, and orange only for emphasis, transition, or management attention.
- Avoid gradients, shadows, 3D shapes, stock photos, decorative icons, and ornamental arrows.
- Use no more than four accent colors on one slide.
- Use no more than six nodes in a left-to-right process chain.
- Do not place paragraphs inside cards. Convert prose into “role/action/result” fragments.
- Do not reduce body text below 11 pt in a 16:9 slide. If content does not fit, shorten or split the slide.
- End with a dark conclusion strip when the management implication, target structure, or decision needs explicit closure. For pure dashboards and schedules, use one highlighted result or decision column instead.

## Content architecture

Build the slide in this order:

1. Section label: small orange text in the top-left.
2. Governing title: one line whenever possible, two lines maximum.
3. Optional subtitle: one sentence explaining the proof logic.
4. Main evidence or operating-model structure.
5. Bottom conclusion strip or highlighted result column: the decision, target state, or management implication.

Do not add a subtitle when the title and structure are already self-explanatory.

## Platform adaptation

- When direct PPT creation is available, create a 16:9 editable slide using native shapes, text boxes, and lines. Use the bundled reference images only as visual references.
- When only document or canvas generation is available, produce the same layout as editable HTML/SVG or structured slide JSON.
- When the platform only accepts instructions, return a slide specification containing: title, layout type, grid, text per block, color token per block, and QA checklist.
- For WorkBuddy or another agentic platform, provide the full skill folder as context. Run the Fast Loop as a deck-level batch: create one specification, generate all slides, render once, and repair only failed pages. If the platform cannot interpret links inside `SKILL.md`, also attach `fast-loop.md`, `layout-library.md`, `layout-specs.json`, the selected layout references, and the matching public examples from `examples/`.

Read [references/platform-adapters.md](references/platform-adapters.md) when the target platform is not ChatGPT/Codex or cannot generate editable PPTX directly.

## Required quality check

Before delivery, confirm all of the following:

- The title makes a claim.
- Every major claim has evidence or a defined responsibility.
- The page can be understood in five seconds at the structural level.
- The reading order is left-to-right and top-to-bottom.
- All repeated elements share identical dimensions and spacing.
- No label, arrow, or colored tag exists without a functional purpose.
- The darkest element is either the title or the final conclusion strip.
- The slide remains readable when viewed at 70% scale.

Use [assets/design-tokens.json](assets/design-tokens.json) when a machine-readable design specification is more useful than prose. Use [examples/evidence-matrix.svg](examples/evidence-matrix.svg) and [examples/operating-model.svg](examples/operating-model.svg) as the canonical public visual targets.
