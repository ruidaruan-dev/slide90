#!/usr/bin/env python3
"""Create a deterministic portable Slide90 skill archive."""

from __future__ import annotations

import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
OUTPUT = DIST / "slide90.skill.zip"
INCLUDE = (
    "SKILL.md",
    "agents",
    "assets",
    "references",
    "examples",
    "bin",
    "src",
    "schema",
    "package.json",
    "package-lock.json",
)
FIXED_TIME = (2026, 1, 1, 0, 0, 0)


def iter_files() -> list[Path]:
    files: list[Path] = []
    for item in INCLUDE:
        path = ROOT / item
        if path.is_file():
            files.append(path)
        elif path.is_dir():
            files.extend(
                sorted(
                    p for p in path.rglob("*")
                    if p.is_file() and "slide90-p0-demo" not in p.parts
                )
            )
        else:
            raise SystemExit(f"Missing runtime item: {path}")
    return sorted(files)


def main() -> None:
    DIST.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for source in iter_files():
            relative = source.relative_to(ROOT)
            info = zipfile.ZipInfo(f"build-executive-report-slides/{relative.as_posix()}", FIXED_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o755 if relative.parts[0] == "bin" else 0o644) << 16
            archive.writestr(info, source.read_bytes())
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    main()
