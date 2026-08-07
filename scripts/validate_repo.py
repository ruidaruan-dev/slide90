#!/usr/bin/env python3
"""Validate repository structure, skill metadata, links, JSON, and public hygiene."""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "README.md",
    "README.zh-CN.md",
    "SKILL.md",
    "LICENSE",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "ROADMAP.md",
    "BENCHMARK.md",
    "agents/openai.yaml",
    "assets/design-tokens.json",
    "assets/layout-specs.json",
    "assets/slide90-demo.gif",
    "assets/slide90-demo-poster.png",
    "references/fast-loop.md",
    "scripts/validate_deck_spec.py",
    "references/layout-library.md",
    "references/style-system.md",
    "references/content-compression.md",
    "examples/evidence-matrix.svg",
    "examples/operating-model.svg",
    "evals/cases.json",
    "evals/cases.schema.json",
    "evals/validate.mjs",
    "evals/score.mjs",
    "evals/run-baseline.mjs",
    "package.json",
    "schema/deck-spec.schema.json",
    "bin/slide90.mjs",
    "src/validate.mjs",
    "src/render/index.mjs",
    "src/render/layouts/evidence-matrix.mjs",
    "src/render/layouts/capability-loop.mjs",
    "src/render/layouts/performance-dashboard.mjs",
    "src/render/layouts/roadmap.mjs",
    "src/render/layouts/portfolio-table.mjs",
    "src/render/layouts/decision-page.mjs",
    "src/render/layouts/project-charter.mjs",
    "src/render/layouts/project-health.mjs",
    "src/render/layouts/milestone-gantt.mjs",
    "src/render/layouts/raid-table.mjs",
    "src/render/layouts/solution-flow.mjs",
    "examples/end-to-end/source.md",
    "examples/end-to-end/deck-spec.json",
    "benchmarks/cases/five-slide.json",
    "benchmarks/run.mjs",
    "scripts/verify_p0.mjs",
    "benchmarks/results/p0-verification-latest.json",
    "examples/p1/deck-spec.zh-CN.json",
    "examples/p1/replacement-slide-5.zh-CN.json",
    "scripts/verify_p1.mjs",
    "benchmarks/results/p1-verification-latest.json",
    "examples/project-report/deck-spec.zh-CN.json",
    "scripts/verify_project_reporting.mjs",
    "benchmarks/results/project-reporting-verification-latest.json",
)
SCAN_DIRS = ("references", "examples", "evals", "assets", "schema", "bin", "src", "benchmarks", "tests-node")
PUBLIC_TEXT_FILES = ("README.md", "README.zh-CN.md", "SKILL.md", "CONTRIBUTING.md", "ROADMAP.md", "BENCHMARK.md")
BANNED_MARKERS = (
    "KINGFA",
    "金发科技",
    "libfile_",
    "file_000000",
    "K0A0534",
)
LINK_PATTERN = re.compile(r"!?(?:\[[^\]]*\])\(([^)]+)\)")


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def validate_required(errors: list[str]) -> None:
    for relative in REQUIRED:
        if not (ROOT / relative).is_file():
            fail(errors, f"missing required file: {relative}")


def validate_skill(errors: list[str]) -> None:
    text = (ROOT / "SKILL.md").read_text(encoding="utf-8")
    if not text.startswith("---\n") or "\n---\n" not in text[4:]:
        fail(errors, "SKILL.md has invalid YAML frontmatter fences")
    if "name: build-executive-report-slides" not in text:
        fail(errors, "SKILL.md must declare name: build-executive-report-slides")
    if "description:" not in text.split("---", 2)[1]:
        fail(errors, "SKILL.md frontmatter is missing description")
    if len(text.splitlines()) > 500:
        fail(errors, "SKILL.md exceeds 500 lines; move detail into references")
    if re.search(r"(?:/Users/|/home/|[A-Z]:\\\\)", text):
        fail(errors, "SKILL.md contains a machine-specific absolute path")


def markdown_files() -> list[Path]:
    return sorted(path for path in ROOT.rglob("*.md") if not ignored(path))


def ignored(path: Path) -> bool:
    return any(part in {".git", "node_modules", "dist", "scratch"} for part in path.relative_to(ROOT).parts)


def validate_links(errors: list[str]) -> None:
    for path in markdown_files():
        text = path.read_text(encoding="utf-8")
        for target in LINK_PATTERN.findall(text):
            target = target.split("#", 1)[0]
            if not target or target.startswith(("http://", "https://", "mailto:")):
                continue
            resolved = (path.parent / target).resolve()
            try:
                resolved.relative_to(ROOT.resolve())
            except ValueError:
                fail(errors, f"link escapes repository: {path.relative_to(ROOT)} -> {target}")
                continue
            if not resolved.exists():
                fail(errors, f"broken local link: {path.relative_to(ROOT)} -> {target}")


def scan_paths() -> list[Path]:
    paths = [ROOT / relative for relative in PUBLIC_TEXT_FILES]
    for directory in SCAN_DIRS:
        paths.extend(p for p in (ROOT / directory).rglob("*") if p.is_file())
    return sorted(set(paths))


def validate_public_hygiene(errors: list[str]) -> None:
    for path in scan_paths():
        if path.suffix.lower() not in {".md", ".json", ".yaml", ".yml", ".svg", ".txt", ".mjs"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for marker in BANNED_MARKERS:
            if marker.lower() in text.lower():
                fail(errors, f"possible proprietary marker in {path.relative_to(ROOT)}: {marker}")


def validate_json(errors: list[str]) -> None:
    for path in ROOT.rglob("*.json"):
        if ignored(path):
            continue
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            fail(errors, f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def validate_svgs(errors: list[str]) -> None:
    for relative in ("examples/evidence-matrix.svg", "examples/operating-model.svg", "assets/logo.svg"):
        path = ROOT / relative
        try:
            root = ET.parse(path).getroot()
        except (ET.ParseError, OSError) as exc:
            fail(errors, f"invalid SVG {relative}: {exc}")
            continue
        view_box = root.attrib.get("viewBox")
        if not view_box:
            fail(errors, f"SVG lacks viewBox: {relative}")


def validate_evals(errors: list[str]) -> None:
    suite = json.loads((ROOT / "evals/cases.json").read_text(encoding="utf-8"))
    cases = suite.get("cases", [])
    if len(cases) != 24:
        fail(errors, "evals/cases.json must contain exactly 24 core cases")
    ids = [case.get("id") for case in cases]
    if len(ids) != len(set(ids)):
        fail(errors, "evaluation case ids must be unique")
    distribution: dict[str, int] = {}
    for case in cases:
        layout = case.get("expected_layout")
        distribution[layout] = distribution.get(layout, 0) + 1
    if len(distribution) != 8 or any(count != 3 for count in distribution.values()):
        fail(errors, "evaluation suite must contain three cases for each of eight layout routes")


def validate_renderer_contract(errors: list[str]) -> None:
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    if package.get("bin", {}).get("slide90") != "bin/slide90.mjs":
        fail(errors, "package.json must expose the slide90 CLI")
    schema = json.loads((ROOT / "schema/deck-spec.schema.json").read_text(encoding="utf-8"))
    layouts = schema["$defs"]["slide"]["properties"]["layout"]["enum"]
    for layout in (
        "performance-dashboard", "evidence-matrix", "roadmap", "capability-loop",
        "portfolio-table", "decision-page", "project-charter", "project-health",
        "milestone-gantt", "raid-table", "solution-flow",
    ):
        if layout not in layouts:
            fail(errors, f"deck schema is missing renderer layout: {layout}")


def main() -> int:
    errors: list[str] = []
    validate_required(errors)
    if not errors:
        validate_skill(errors)
        validate_links(errors)
        validate_public_hygiene(errors)
        validate_json(errors)
        validate_svgs(errors)
        validate_evals(errors)
        validate_renderer_contract(errors)
    if errors:
        print("Validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Validation passed: repository is release-ready.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
