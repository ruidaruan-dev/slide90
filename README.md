# Slide90

**Spend less time formatting. Make decisions visible.**

Slide90 is an open-source Agent Skill that turns raw business material into compact, decision-ready executive slides. It plans the full deck once, renders in batch, validates structure before drawing, locks passing slides, and repairs only failed elements.

In our controlled five-slide runtime benchmark, the Fast Loop reduced wall time by **79.4%** while producing pixel-identical output. The name is the ambition; the benchmark is the evidence.

[中文说明](README.zh-CN.md) · [Benchmark](BENCHMARK.md) · [Roadmap](ROADMAP.md) · [Contributing](CONTRIBUTING.md)

![Slide90 Fast Loop demo](assets/slide90-demo.gif)

## What it produces

| Evidence matrix | Operating model |
|---|---|
| ![Evidence matrix example](examples/evidence-matrix.svg) | ![Operating model example](examples/operating-model.svg) |

The examples use synthetic data and contain no proprietary company information.

## Why Slide90

- **Decision first** — action titles answer the management question instead of naming a topic.
- **Evidence over adjectives** — claims are tied to metrics, delivery proof, mechanisms, or ownership.
- **Plan once, render once** — one deck specification replaces repeated slide-by-slide reasoning.
- **Targeted repair** — passing slides stay locked; only failed elements are regenerated.
- **Tested layouts** — eight executive layouts use fixed content zones and machine-readable design tokens.
- **No AI-slop styling** — strict grid, white canvas, restrained accents, readable type, and no decorative clutter.
- **Cross-platform** — designed for ChatGPT/Codex, Claude Code, Cursor, Gemini CLI, WorkBuddy, and other Agent Skills-compatible runtimes.

## Fast Loop

```mermaid
flowchart LR
    A[Plan full deck] --> B[Validate spec]
    B --> C[Render batch]
    C --> D[Lock passing slides]
    D --> E[Repair failures only]
```

The workflow separates judgment from production. The agent decides the storyline and layout once; deterministic coordinates and validators handle repeated execution.

## Install

```bash
git clone https://github.com/ruidaruan-dev/slide90.git
cd slide90

python scripts/install.py --target codex
# also: claude, cursor, gemini, workbuddy
```

Preview without writing:

```bash
python scripts/install.py --target workbuddy --dry-run
```

Install to a custom location:

```bash
python scripts/install.py --dest /path/to/skills/build-executive-report-slides
```

## Use

```text
Use $build-executive-report-slides in Fast Loop mode to turn these quarterly
project notes into a five-slide executive update. Preserve every number,
use conclusion-led titles, render the deck once, and repair only failed slides.
```

```text
Use $build-executive-report-slides to redesign this role-fit page as an
evidence matrix. Do not invent evidence. Return an editable 16:9 slide.
```

## Eight management layouts

| Management question | Layout ID |
|---|---|
| What has been achieved? | `performance-dashboard` |
| Why should leadership believe it? | `evidence-matrix` |
| What is wrong and why? | `diagnosis-tree` |
| What will we do and when? | `roadmap` |
| How will the organization operate? | `capability-loop` |
| Which projects get resources? | `portfolio-table` |
| Which option should we choose? | `comparison-matrix` |
| What must leadership decide? | `decision-page` |

## Repository structure

```text
slide90/
├── SKILL.md                    # Agent workflow and hard rules
├── assets/layout-specs.json    # Stable layout coordinates
├── assets/design-tokens.json   # Visual system
├── references/fast-loop.md     # Batch and targeted-repair protocol
├── examples/                   # Synthetic visual examples
├── evals/                      # Layout-routing quality cases
├── scripts/                    # Installer, validators, packager
└── .github/workflows/          # Automated validation and releases
```

## Validate and package

```bash
python scripts/validate_repo.py
python -m unittest discover -s tests
python scripts/package_skill.py
```

The portable skill archive is written to `dist/slide90.skill.zip`.

## Privacy

Never commit real internal decks, watermarked screenshots, customer names, confidential metrics, or company templates without written permission. Use synthetic or explicitly cleared examples only.

## License

Apache License 2.0. See [LICENSE](LICENSE).
