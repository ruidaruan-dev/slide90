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
    "references/fast-loop.md",
    "scripts/validate_deck_spec.py",
    "references/layout-library.md",
    "references/style-system.md",
    "references/content-compression.md",
    "examples/evidence-matrix.svg",
    "examples/operating-model.svg",
    "evals/cases.json",
)
SCAN_DIRS = ("references", "examples", "evals", "assets")
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
    return sorted(ROOT.rglob("*.md"))


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
        if path.suffix.lower() not in {".md", ".json", ".yaml", ".yml", ".svg", ".txt"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for marker in BANNED_MARKERS:
            if marker.lower() in text.lower():
                fail(errors, f"possible proprietary marker in {path.relative_to(ROOT)}: {marker}")


def validate_json(errors: list[str]) -> None:
    for path in ROOT.rglob("*.json"):
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
    cases = json.loads((ROOT / "evals/cases.json").read_text(encoding="utf-8"))
    if len(cases) < 8:
        fail(errors, "evals/cases.json must cover all eight layout routes")
    ids = [case.get("id") for case in cases]
    if len(ids) != len(set(ids)):
        fail(errors, "evaluation case ids must be unique")


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
    if errors:
        print("Validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Validation passed: repository is release-ready.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
