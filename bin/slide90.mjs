#!/usr/bin/env node

import process from "node:process";

import packageJson from "../package.json" with { type: "json" };
import { readJson, writeJson } from "../src/io.mjs";
import { renderDeckSpec } from "../src/render/index.mjs";
import { formatValidationErrors, validateDeckSpec } from "../src/validate.mjs";


const HELP = `Slide90 ${packageJson.version}

Usage:
  slide90 validate <deck-spec.json>
  slide90 render <deck-spec.json> --output <deck.pptx>
  slide90 render-slide <deck-spec.json> --slide <number> --output <slide.pptx>
  slide90 replace-slide <deck-spec.json> --slide <number> --with <slide.json> --output <deck.pptx> [--spec-output <updated.json>]
  slide90 --version

Commands:
  validate  Validate the factual and structural contract before rendering.
  render    Validate, then create an editable 16:9 PowerPoint deck.
  render-slide  Render one selected page without regenerating its content.
  replace-slide Replace one page in the spec and deterministically rerender the deck.

Renderer layouts:
  performance-dashboard, evidence-matrix, roadmap, capability-loop, portfolio-table, decision-page,
  project-charter, project-health, milestone-gantt, raid-table, solution-flow
`;


function valueAfter(args, ...flags) {
  for (const flag of flags) {
    const index = args.indexOf(flag);
    if (index >= 0) return args[index + 1];
  }
  return undefined;
}


async function loadAndValidate(inputPath) {
  const spec = await readJson(inputPath);
  const result = await validateDeckSpec(spec);
  if (!result.valid) {
    const error = new Error(formatValidationErrors(result.errors));
    error.exitCode = 1;
    throw error;
  }
  return spec;
}


async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || ["help", "--help", "-h"].includes(command)) {
    process.stdout.write(HELP);
    return;
  }
  if (["--version", "-V"].includes(command)) {
    process.stdout.write(`${packageJson.version}\n`);
    return;
  }

  const inputPath = args[1];
  if (!inputPath) {
    const error = new Error(`Missing deck specification.\n\n${HELP}`);
    error.exitCode = 2;
    throw error;
  }

  if (command === "validate") {
    const spec = await loadAndValidate(inputPath);
    process.stdout.write(`PASS  ${inputPath}  (${spec.slides.length} slides)\n`);
    return;
  }

  if (command === "render") {
    const outputPath = valueAfter(args, "--output", "-o");
    if (!outputPath) {
      const error = new Error("Missing --output <deck.pptx>.");
      error.exitCode = 2;
      throw error;
    }
    const spec = await loadAndValidate(inputPath);
    const output = await renderDeckSpec(spec, outputPath);
    process.stdout.write(`WROTE ${output}  (${spec.slides.length} slides)\n`);
    return;
  }

  if (command === "render-slide") {
    const outputPath = valueAfter(args, "--output", "-o");
    const slideNumber = Number.parseInt(valueAfter(args, "--slide", "-s"), 10);
    if (!outputPath || !Number.isInteger(slideNumber)) {
      const error = new Error("render-slide requires --slide <number> and --output <slide.pptx>.");
      error.exitCode = 2;
      throw error;
    }
    const spec = await loadAndValidate(inputPath);
    const selected = spec.slides.find((slide) => slide.number === slideNumber);
    if (!selected) throw new Error(`Slide ${slideNumber} does not exist.`);
    const output = await renderDeckSpec({ ...spec, slides: [selected] }, outputPath);
    process.stdout.write(`WROTE ${output}  (slide ${slideNumber})\n`);
    return;
  }

  if (command === "replace-slide") {
    const outputPath = valueAfter(args, "--output", "-o");
    const replacementPath = valueAfter(args, "--with", "-w");
    const specOutput = valueAfter(args, "--spec-output");
    const slideNumber = Number.parseInt(valueAfter(args, "--slide", "-s"), 10);
    if (!outputPath || !replacementPath || !Number.isInteger(slideNumber)) {
      const error = new Error("replace-slide requires --slide <number>, --with <slide.json>, and --output <deck.pptx>.");
      error.exitCode = 2;
      throw error;
    }
    const spec = await loadAndValidate(inputPath);
    const replacementFile = await readJson(replacementPath);
    const replacement = structuredClone(replacementFile.slide || replacementFile);
    replacement.number = slideNumber;
    const index = spec.slides.findIndex((slide) => slide.number === slideNumber);
    if (index < 0) throw new Error(`Slide ${slideNumber} does not exist.`);
    const updated = structuredClone(spec);
    updated.slides[index] = replacement;
    const result = await validateDeckSpec(updated);
    if (!result.valid) throw new Error(formatValidationErrors(result.errors));
    if (specOutput) await writeJson(specOutput, updated);
    const output = await renderDeckSpec(updated, outputPath);
    process.stdout.write(`WROTE ${output}  (replaced slide ${slideNumber}${specOutput ? `; spec ${specOutput}` : ""})\n`);
    return;
  }

  const error = new Error(`Unknown command: ${command}\n\n${HELP}`);
  error.exitCode = 2;
  throw error;
}


main().catch((error) => {
  process.stderr.write(`slide90: ${error.message}\n`);
  process.exitCode = error.exitCode || 1;
});
