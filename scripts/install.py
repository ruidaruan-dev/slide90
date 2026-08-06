#!/usr/bin/env python3
"""Install the Slide90 executive-report skill into an Agent Skills directory."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


SKILL_NAME = "build-executive-report-slides"
SOURCE_ROOT = Path(__file__).resolve().parents[1]
RUNTIME_ITEMS = ("SKILL.md", "agents", "assets", "references", "examples")
TARGETS = {
    "codex": Path.home() / ".agents" / "skills" / SKILL_NAME,
    "claude": Path.home() / ".claude" / "skills" / SKILL_NAME,
    "cursor": Path.home() / ".cursor" / "skills" / SKILL_NAME,
    "gemini": Path.home() / ".gemini" / "skills" / SKILL_NAME,
    "workbuddy": Path.home() / ".workbuddy" / "skills" / SKILL_NAME,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--target", choices=sorted(TARGETS))
    group.add_argument("--dest", type=Path, help="Custom destination directory")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without writing")
    parser.add_argument("--force", action="store_true", help="Update an existing installation")
    return parser.parse_args()


def install(destination: Path, *, dry_run: bool = False, force: bool = False) -> None:
    destination = destination.expanduser().resolve()
    if destination.exists() and not force:
        raise SystemExit(f"Destination exists: {destination}\nUse --force to update it.")

    print(f"Source:      {SOURCE_ROOT}")
    print(f"Destination: {destination}")
    for item in RUNTIME_ITEMS:
        source = SOURCE_ROOT / item
        if not source.exists():
            raise SystemExit(f"Missing required runtime item: {source}")
        print(f"  copy {item}")

    if dry_run:
        print("Dry run complete; no files written.")
        return

    destination.mkdir(parents=True, exist_ok=True)
    for item in RUNTIME_ITEMS:
        source = SOURCE_ROOT / item
        target = destination / item
        if source.is_dir():
            shutil.copytree(source, target, dirs_exist_ok=True)
        else:
            shutil.copy2(source, target)
    print(f"Installed {SKILL_NAME} at {destination}")


def main() -> None:
    args = parse_args()
    destination = args.dest if args.dest else TARGETS[args.target]
    install(destination, dry_run=args.dry_run, force=args.force)


if __name__ == "__main__":
    main()
