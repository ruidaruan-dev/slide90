#!/usr/bin/env node

import process from "node:process";

import packageJson from "../package.json" with { type: "json" };
import { readJson } from "../src/io.mjs";
import { renderDeckSpec } from "../src/render/index.mjs";
import { formatValidationErrors, validateDeckSpec } from "../src/validate.mjs";


const HELP = `Slide90 ${packageJson.version}

Usage:
  slide90 validate <deck-spec.json>
  slide90 render <deck-spec.json> --output <deck.pptx>
  slide90 --version

Commands:
  validate  Validate the factual and structural contract before rendering.
  render    Validate, then create an editable 16:9 PowerPoint deck.

P0 renderer layouts:
  evidence-matrix, capability-loop
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

  const error = new Error(`Unknown command: ${command}\n\n${HELP}`);
  error.exitCode = 2;
  throw error;
}


main().catch((error) => {
  process.stderr.write(`slide90: ${error.message}\n`);
  process.exitCode = error.exitCode || 1;
});
