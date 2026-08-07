#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import JSZip from "jszip";


const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SPEC = path.join(ROOT, "examples/p1/deck-spec.zh-CN.json");
const REPLACEMENT = path.join(ROOT, "examples/p1/replacement-slide-5.zh-CN.json");
const MAX_SECONDS = 600;
const budgetSeconds = Number.parseFloat(process.env.SLIDE90_P1_BUDGET_SECONDS || String(MAX_SECONDS));
if (!Number.isFinite(budgetSeconds) || budgetSeconds <= 0 || budgetSeconds > MAX_SECONDS) {
  throw new Error(`SLIDE90_P1_BUDGET_SECONDS must be greater than 0 and no more than ${MAX_SECONDS}.`);
}
const reportPath = path.resolve(process.env.SLIDE90_P1_REPORT || path.join(ROOT, "benchmarks/results/p1-verification-latest.json"));
const started = performance.now();
const steps = [];


function remainingMs() {
  return Math.max(1, budgetSeconds * 1000 - (performance.now() - started));
}


function run(name, args) {
  const stepStarted = performance.now();
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", timeout: Math.floor(remainingMs()) });
  steps.push({ name, duration_ms: Number((performance.now() - stepStarted).toFixed(3)), status: result.status === 0 ? "pass" : "fail" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${name} failed:\n${result.stdout}${result.stderr}`.trim());
  return result;
}


async function inspect(filePath, expectedSlides) {
  const zip = await JSZip.loadAsync(await fs.readFile(filePath));
  const names = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort();
  const notes = Object.keys(zip.files).filter((name) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name));
  if (names.length !== expectedSlides) throw new Error(`Expected ${expectedSlides} slides, found ${names.length}.`);
  if (notes.length !== expectedSlides) throw new Error(`Expected ${expectedSlides} notes blocks, found ${notes.length}.`);
  const xml = await Promise.all(names.map((name) => zip.file(name).async("string")));
  const shapeCounts = xml.map((value) => (value.match(/<p:sp>/g) || []).length);
  if (shapeCounts.some((count) => count < 12)) throw new Error(`Every slide must contain at least 12 editable shapes: ${shapeCounts.join(", ")}`);
  if (xml.some((value) => !value.includes("Microsoft YaHei"))) throw new Error("Every Chinese slide must declare a CJK font.");
  return {
    xml,
    fingerprint: crypto.createHash("sha256").update(xml.join("\n")).digest("hex"),
    shape_counts: shapeCounts
  };
}


async function writeReport(report) {
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}


async function main() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "slide90-p1-verify-"));
  try {
    run("validate-six-layout-fixture", ["bin/slide90.mjs", "validate", SPEC]);
    const runs = [];
    for (let index = 1; index <= 3; index += 1) {
      const output = path.join(temp, `full-${index}.pptx`);
      const runStarted = performance.now();
      run(`full-deck-render-${index}`, ["bin/slide90.mjs", "render", SPEC, "--output", output]);
      runs.push({ duration_ms: Number((performance.now() - runStarted).toFixed(3)), ...(await inspect(output, 6)), output });
    }
    if (new Set(runs.map((item) => item.fingerprint)).size !== 1) throw new Error("Repeated full-deck renders are not semantically stable.");

    const single = path.join(temp, "single.pptx");
    run("single-slide-render", ["bin/slide90.mjs", "render-slide", SPEC, "--slide", "3", "--output", single]);
    await inspect(single, 1);

    const updated = path.join(temp, "updated.pptx");
    const updatedSpec = path.join(temp, "updated.json");
    run("targeted-slide-replacement", [
      "bin/slide90.mjs", "replace-slide", SPEC, "--slide", "5", "--with", REPLACEMENT,
      "--spec-output", updatedSpec, "--output", updated
    ]);
    const replacementInspection = await inspect(updated, 6);
    const unchanged = [0, 1, 2, 3, 5].every((index) => runs[0].xml[index] === replacementInspection.xml[index]);
    if (!unchanged || runs[0].xml[4] === replacementInspection.xml[4]) {
      throw new Error("Targeted replacement changed a locked page or failed to change slide 5.");
    }

    const totalSeconds = Number(((performance.now() - started) / 1000).toFixed(3));
    if (totalSeconds > budgetSeconds) throw new Error(`P1 verification exceeded ${budgetSeconds} seconds.`);
    const report = {
      version: "0.3.0-alpha.1",
      status: "pass",
      generated_at: new Date().toISOString(),
      positioning: "Fast, stable, editable 80-point executive drafts; refinement remains targeted and optional.",
      budget_seconds: budgetSeconds,
      total_seconds: totalSeconds,
      supported_renderer_layouts: 6,
      fixture_slides: 6,
      must_keep_facts: 4,
      full_deck_stability_runs: 3,
      stable_semantic_fingerprint: runs[0].fingerprint,
      maximum_full_deck_render_seconds: Number((Math.max(...runs.map((item) => item.duration_ms)) / 1000).toFixed(3)),
      single_slide_render: "pass",
      targeted_replacement: "pass",
      unaffected_slides_preserved: 5,
      chinese_font_declared_on_all_slides: true,
      editable_shape_counts: runs[0].shape_counts,
      checks: steps
    };
    await writeReport(report);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}


main().catch(async (error) => {
  const report = {
    version: "0.3.0-alpha.1",
    status: "fail",
    generated_at: new Date().toISOString(),
    budget_seconds: budgetSeconds,
    total_seconds: Number(((performance.now() - started) / 1000).toFixed(3)),
    error: error.message,
    checks: steps
  };
  await writeReport(report).catch(() => {});
  process.stderr.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = 1;
});
