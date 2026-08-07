#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES_PATH = path.join(ROOT, "evals/cases.json");
const SCHEMA_PATH = path.join(ROOT, "evals/cases.schema.json");
const EXPECTED_LAYOUTS = [
  "performance-dashboard", "evidence-matrix", "diagnosis-tree", "roadmap",
  "capability-loop", "portfolio-table", "comparison-matrix", "decision-page"
];

function normalize(value) {
  return value.toLowerCase().replace(/[，。；：、,.:%％+—–\-×/（）()\s]/g, "");
}

function grounded(prompt, fact) {
  if (normalize(prompt).includes(normalize(fact))) return true;
  const tokens = fact.split(/[，。；：、,.:%％+—–\-×/（）()\s]/).map(normalize).filter((token) => token.length >= 2);
  return tokens.length > 0 && tokens.every((token) => normalize(prompt).includes(token));
}

export async function validateEvalSuite(suite) {
  const schema = JSON.parse(await fs.readFile(SCHEMA_PATH, "utf8"));
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  const errors = validate(suite) ? [] : validate.errors.map((error) => `${error.instancePath || "/"} ${error.message}`);
  const ids = new Set();
  const distribution = Object.fromEntries(EXPECTED_LAYOUTS.map((layout) => [layout, 0]));

  for (const item of suite.cases || []) {
    if (ids.has(item.id)) errors.push(`duplicate case id: ${item.id}`);
    ids.add(item.id);
    if (item.category !== item.expected_layout) errors.push(`${item.id}: category and expected_layout must match`);
    if (Object.hasOwn(distribution, item.expected_layout)) distribution[item.expected_layout] += 1;
    for (const fact of item.required_facts || []) {
      if (!grounded(item.prompt, fact)) errors.push(`${item.id}: required fact is not grounded in prompt: ${fact}`);
    }
  }

  for (const layout of EXPECTED_LAYOUTS) {
    if (distribution[layout] !== 3) errors.push(`${layout}: expected 3 cases, found ${distribution[layout]}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      cases: suite.cases?.length || 0,
      layouts: EXPECTED_LAYOUTS.length,
      cases_per_layout: distribution,
      required_fact_checks: (suite.cases || []).reduce((sum, item) => sum + item.required_facts.length, 0),
      invention_guardrails: (suite.cases || []).reduce((sum, item) => sum + item.must_not_invent.length, 0)
    }
  };
}

async function main() {
  const suite = JSON.parse(await fs.readFile(CASES_PATH, "utf8"));
  const result = await validateEvalSuite(suite);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.valid) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`eval-suite: ${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
