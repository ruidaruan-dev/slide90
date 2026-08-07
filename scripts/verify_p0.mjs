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
const SPEC_PATH = path.join(ROOT, "examples/end-to-end/deck-spec.json");
const MAX_BUDGET_SECONDS = 600;
const requestedBudget = Number.parseFloat(process.env.SLIDE90_P0_BUDGET_SECONDS || String(MAX_BUDGET_SECONDS));
if (!Number.isFinite(requestedBudget) || requestedBudget <= 0 || requestedBudget > MAX_BUDGET_SECONDS) {
  throw new Error(`SLIDE90_P0_BUDGET_SECONDS must be greater than 0 and no more than ${MAX_BUDGET_SECONDS}.`);
}

const budgetMs = requestedBudget * 1000;
const startedAt = performance.now();
const reportPath = path.resolve(
  process.env.SLIDE90_P0_REPORT || path.join(ROOT, "benchmarks/results/p0-verification-latest.json")
);
const steps = [];


function elapsedMs() {
  return performance.now() - startedAt;
}


function remainingMs() {
  return Math.max(1, budgetMs - elapsedMs());
}


function runStep(name, command, args, options = {}) {
  const started = performance.now();
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: Math.floor(remainingMs()),
    env: { ...process.env, ...(options.env || {}) }
  });
  const duration = performance.now() - started;
  steps.push({ name, duration_ms: Number(duration.toFixed(3)), status: result.status === 0 ? "pass" : "fail" });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${name} failed${detail ? `:\n${detail}` : "."}`);
  }
  if (elapsedMs() > budgetMs) throw new Error(`${name} exceeded the ${requestedBudget}-second P0 budget.`);
  return result;
}


function numericSlideOrder(name) {
  const match = name.match(/slide(\d+)\.xml$/);
  return match ? Number.parseInt(match[1], 10) : 0;
}


async function inspectPptx(filePath) {
  const bytes = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(bytes);
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => numericSlideOrder(a) - numericSlideOrder(b));
  const notesNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name))
    .sort((a, b) => numericSlideOrder(a) - numericSlideOrder(b));

  if (slideNames.length !== 2) throw new Error(`Expected 2 slides, found ${slideNames.length}.`);
  if (notesNames.length !== slideNames.length) {
    throw new Error(`Expected one source-notes block per slide, found ${notesNames.length}.`);
  }

  for (const name of notesNames) {
    const xml = await zip.file(name).async("string");
    if (!xml.includes("[Sources]")) throw new Error(`${name} is missing its [Sources] block.`);
  }

  const slideXml = [];
  const slideChecks = [];
  for (const name of slideNames) {
    const xml = await zip.file(name).async("string");
    const shapeCount = (xml.match(/<p:sp>/g) || []).length;
    const textRunCount = (xml.match(/<a:t>/g) || []).length;
    const pictureCount = (xml.match(/<p:pic>/g) || []).length;
    if (shapeCount < 15) throw new Error(`${name} has too few editable shapes: ${shapeCount}.`);
    if (textRunCount < 15) throw new Error(`${name} has too little editable text: ${textRunCount}.`);
    if (pictureCount > 0) throw new Error(`${name} contains raster pictures; P0 fixtures must remain fully editable.`);
    slideXml.push(xml);
    slideChecks.push({ slide: name, editable_shapes: shapeCount, text_runs: textRunCount, pictures: pictureCount });
  }

  const fingerprint = crypto.createHash("sha256").update(slideXml.join("\n")).digest("hex");
  return {
    bytes: bytes.length,
    slide_count: slideNames.length,
    source_notes_count: notesNames.length,
    fingerprint,
    slides: slideChecks
  };
}


async function writeReport(report) {
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}


async function main() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "slide90-p0-verify-"));
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const generationRuns = [];

  try {
    runStep("node-tests", npm, ["test"]);
    runStep("core-eval-suite", npm, ["run", "eval:validate"]);
    runStep("deck-spec-validation", process.execPath, ["bin/slide90.mjs", "validate", SPEC_PATH]);

    for (let run = 1; run <= 3; run += 1) {
      const output = path.join(tempDir, `p0-run-${run}.pptx`);
      const started = performance.now();
      runStep(`editable-pptx-render-${run}`, process.execPath, [
        "bin/slide90.mjs", "render", SPEC_PATH, "--output", output
      ]);
      const inspection = await inspectPptx(output);
      generationRuns.push({
        run,
        duration_ms: Number((performance.now() - started).toFixed(3)),
        ...inspection
      });
    }

    const fingerprints = new Set(generationRuns.map((run) => run.fingerprint));
    if (fingerprints.size !== 1) throw new Error("Repeated renders produced different slide XML fingerprints.");

    const benchmarkPath = path.join(tempDir, "benchmark.json");
    runStep("five-slide-benchmark", process.execPath, ["benchmarks/run.mjs"], {
      env: { SLIDE90_BENCHMARK_OUTPUT: benchmarkPath, SLIDE90_BENCHMARK_RUNS: "3" }
    });
    const benchmark = JSON.parse(await fs.readFile(benchmarkPath, "utf8"));
    const total = elapsedMs();
    if (total > budgetMs) throw new Error(`P0 verification took ${(total / 1000).toFixed(3)} seconds.`);

    const report = {
      version: "0.2.0-alpha.1",
      status: "pass",
      generated_at: new Date().toISOString(),
      scope: "Installed local runtime; excludes dependency installation, model inference, network, and queue latency.",
      budget_seconds: requestedBudget,
      total_seconds: Number((total / 1000).toFixed(3)),
      stability_runs: generationRuns.length,
      stable_semantic_fingerprint: generationRuns[0].fingerprint,
      maximum_generation_seconds: Number((Math.max(...generationRuns.map((run) => run.duration_ms)) / 1000).toFixed(3)),
      generation_runs: generationRuns,
      benchmark: {
        slides: benchmark.slides,
        median_sequential_ms: benchmark.median_sequential_ms,
        median_batch_ms: benchmark.median_batch_ms,
        speedup: benchmark.speedup,
        reduction_percent: benchmark.reduction_percent
      },
      checks: steps
    };
    await writeReport(report);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}


main().catch(async (error) => {
  const report = {
    version: "0.2.0-alpha.1",
    status: "fail",
    generated_at: new Date().toISOString(),
    budget_seconds: requestedBudget,
    total_seconds: Number((elapsedMs() / 1000).toFixed(3)),
    error: error.message,
    checks: steps
  };
  await writeReport(report).catch(() => {});
  process.stderr.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = 1;
});
