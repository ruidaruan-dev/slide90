#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";

import { renderDeckSpec } from "../src/render/index.mjs";
import { validateDeckSpec } from "../src/validate.mjs";


const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CASE_PATH = path.join(ROOT, "benchmarks/cases/five-slide.json");
const RESULT_PATH = process.env.SLIDE90_BENCHMARK_OUTPUT
  ? path.resolve(process.env.SLIDE90_BENCHMARK_OUTPUT)
  : path.join(ROOT, "benchmarks/results/latest.json");
const RUNS = Number.parseInt(process.env.SLIDE90_BENCHMARK_RUNS || "3", 10);


function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}


async function timeRun(callback) {
  const start = performance.now();
  await callback();
  return performance.now() - start;
}


async function sequential(spec, directory, run) {
  return timeRun(async () => {
    for (const slide of spec.slides) {
      const single = { ...spec, slides: [slide] };
      const result = await validateDeckSpec(single);
      if (!result.valid) throw new Error(JSON.stringify(result.errors));
      await renderDeckSpec(single, path.join(directory, `sequential-${run}-${slide.number}.pptx`));
    }
  });
}


async function batch(spec, directory, run) {
  return timeRun(async () => {
    const result = await validateDeckSpec(spec);
    if (!result.valid) throw new Error(JSON.stringify(result.errors));
    await renderDeckSpec(spec, path.join(directory, `batch-${run}.pptx`));
  });
}


async function main() {
  if (!Number.isInteger(RUNS) || RUNS < 1 || RUNS > 20) throw new Error("SLIDE90_BENCHMARK_RUNS must be 1–20.");
  const spec = JSON.parse(await fs.readFile(CASE_PATH, "utf8"));
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "slide90-benchmark-"));
  const sequentialMs = [];
  const batchMs = [];

  try {
    await batch(spec, directory, "warmup");
    for (let run = 1; run <= RUNS; run += 1) {
      sequentialMs.push(await sequential(spec, directory, run));
      batchMs.push(await batch(spec, directory, run));
    }
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }

  const sequentialMedian = median(sequentialMs);
  const batchMedian = median(batchMs);
  const result = {
    benchmark: "slide90-p0-renderer",
    generated_at: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, architecture: process.arch },
    scope: "Local schema validation plus PPTX generation; excludes model, network, and office-app startup latency.",
    case: "benchmarks/cases/five-slide.json",
    slides: spec.slides.length,
    runs: RUNS,
    sequential_ms: sequentialMs.map((value) => Number(value.toFixed(3))),
    batch_ms: batchMs.map((value) => Number(value.toFixed(3))),
    median_sequential_ms: Number(sequentialMedian.toFixed(3)),
    median_batch_ms: Number(batchMedian.toFixed(3)),
    speedup: Number((sequentialMedian / batchMedian).toFixed(2)),
    reduction_percent: Number(((1 - batchMedian / sequentialMedian) * 100).toFixed(1))
  };

  await fs.mkdir(path.dirname(RESULT_PATH), { recursive: true });
  await fs.writeFile(RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}


main().catch((error) => {
  process.stderr.write(`benchmark: ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
