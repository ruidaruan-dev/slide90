from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ToolingTests(unittest.TestCase):
    def run_script(self, script: str, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(ROOT / "scripts" / script), *args],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )

    def test_repository_validation(self) -> None:
        result = self.run_script("validate_repo.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_custom_install(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "build-executive-report-slides"
            result = self.run_script("install.py", "--dest", str(destination))
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertTrue((destination / "SKILL.md").is_file())
            self.assertTrue((destination / "references/layout-library.md").is_file())
            self.assertTrue((destination / "examples/evidence-matrix.svg").is_file())
            self.assertTrue((destination / "bin/slide90.mjs").is_file())
            self.assertTrue((destination / "schema/deck-spec.schema.json").is_file())

    def test_dry_run_does_not_write(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "build-executive-report-slides"
            result = self.run_script("install.py", "--dest", str(destination), "--dry-run")
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertFalse(destination.exists())

    def test_package_contents(self) -> None:
        result = self.run_script("package_skill.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        archive = ROOT / "dist/slide90.skill.zip"
        self.assertTrue(archive.is_file())
        with zipfile.ZipFile(archive) as package:
            names = set(package.namelist())
        self.assertIn("build-executive-report-slides/SKILL.md", names)
        self.assertIn("build-executive-report-slides/assets/design-tokens.json", names)
        self.assertIn("build-executive-report-slides/assets/layout-specs.json", names)
        self.assertIn("build-executive-report-slides/examples/operating-model.svg", names)
        self.assertIn("build-executive-report-slides/bin/slide90.mjs", names)
        self.assertIn("build-executive-report-slides/src/render/index.mjs", names)
        self.assertIn("build-executive-report-slides/schema/deck-spec.schema.json", names)
        self.assertFalse(any("README" in name for name in names))

    def test_deck_spec_validator(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            spec = Path(directory) / "deck-spec.json"
            spec.write_text(
                '{"slides":[{"title":"Three results support Q4 scale-up",'
                '"layout":"performance-dashboard","metrics":[],"blocks":[],'
                '"conclusion":"Approve the next cohort"}]}',
                encoding="utf-8",
            )
            result = self.run_script("validate_deck_spec.py", str(spec))
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
