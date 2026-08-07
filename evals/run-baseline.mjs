#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUITE_PATH = path.join(ROOT, "evals/cases.json");
const OUTPUT_PATH = path.resolve(process.argv[2] || path.join(ROOT, "evals/results/baseline-candidates.json"));

function route(prompt) {
  if (/request approval|request closure|decide whether/i.test(prompt)) return "decision-page";
  if (/compare/i.test(prompt)) return "comparison-matrix";
  if (/portfolio|owns two small|review six sample/i.test(prompt)) return "portfolio-table";
  if (/plan|july-to-december|targets launch/i.test(prompt)) return "roadmap";
  if (/increased from|accuracy fell|inventory days rose/i.test(prompt)) return "diagnosis-tree";
  if (/assess|recommend vendor|ready to start/i.test(prompt)) return "evidence-matrix";
  if (/loop/i.test(prompt)) return "capability-loop";
  return "performance-dashboard";
}

function makeTitle(prompt) {
  const sentences = prompt.split(/[。！？]/).map((item) => item.trim()).filter(Boolean);
  const conclusion = sentences.find((item) => /recommend|priority|needs attention|must|decide|approve|while/i.test(item));
  return (conclusion || sentences.at(-1) || "管理结论").slice(0, 80);
}

async function main() {
  const suite = JSON.parse(await fs.readFile(SUITE_PATH, "utf8"));
  const submission = {
    generator: "slide90-rule-baseline-v1",
    answer_key_access: false,
    cases: suite.cases.map(({ id, prompt }) => ({
      id,
      layout: route(prompt),
      title: makeTitle(prompt),
      content: prompt
    }))
  };
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(submission, null, 2)}\n`, "utf8");
  process.stdout.write(`${OUTPUT_PATH}\n`);
}

main().catch((error) => {
  process.stderr.write(`eval-baseline: ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
