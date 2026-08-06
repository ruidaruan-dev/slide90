# Platform adapters

## Direct PPT-capable platform

Ask the platform to generate a 16:9 editable slide with native text boxes, rectangles, lines, and arrows. Provide:

- `SKILL.md`;
- the relevant layout reference;
- `assets/design-tokens.json`;
- the matching reference image.

Require a rendered preview and an overflow check before final delivery.

## WorkBuddy or knowledge-based agent platform

Use the skill folder as the instruction/knowledge package. If the platform accepts only a single instruction document, concatenate in this order:

1. `SKILL.md`
2. `references/fast-loop.md`
3. `references/style-system.md`
4. `references/layout-library.md`
5. one selected layout reference when applicable
6. `references/content-compression.md`

For a multi-slide request, require WorkBuddy to create one `deck-spec.json` for the complete deck before opening PowerPoint or drawing any shape. Validate it once, render every slide as one batch, and keep a list of passed slide numbers. During repair, regenerate only slide numbers that failed. Do not rerun source extraction or redesign passed slides.

Attach the matching reference image separately when visual inputs are supported.

Recommended task prompt:

```text
Use the executive report slide style skill in Fast Loop mode. First create one deck-level specification with conclusion-led titles and a tested layout ID for every slide. Validate the specification, generate the complete editable 16:9 deck in one batch using the exact layout coordinates and design tokens, render once, lock every passing slide, and repair only failed elements. Preserve all factual numbers and do not invent evidence.
```

## Text-only agent

Ask for a slide specification with this schema:

```text
Governing title:
Subtitle:
Layout type:
Grid:
Blocks:
  - position:
    role:
    text:
    fill token:
    accent token:
Bottom conclusion:
QA findings:
```

Pass the specification to a separate presentation-rendering agent.

## Fallback behavior

If the platform cannot inspect images, rely on `style-system.md` and the selected layout reference. If the platform cannot generate editable slides, generate SVG or HTML rather than a raster image whenever possible.
