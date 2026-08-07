#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUITE_PATH = path.join(ROOT, "evals/cases.json");

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[，。；：、,.:%％+—–\-×/（）()\s]/g, "");
}

function contains(candidate, phrase) {
  const text = normalize(`${candidate.title || ""} ${candidate.content || ""}`);
  const whole = normalize(phrase);
  if (text.includes(whole)) return true;
  const tokens = phrase.split(/[，。；：、,.:%％+—–\-×/（）()\s]/).map(normalize).filter((token) => token.length >= 2);
  return tokens.length > 0 && tokens.every((token) => text.includes(token));
}

export function scoreCandidates(suite, submission) {
  const submitted = new Map((submission.cases || []).map((item) => [item.id, item]));
  const results = [];
  let layoutHits = 0;
  let retainedFacts = 0;
  let totalFacts = 0;
  let forbiddenHits = 0;
  let totalForbidden = 0;

  for (const expected of suite.cases) {
    const candidate = submitted.get(expected.id);
    const errors = [];
    if (!candidate) {
      results.push({ id: expected.id, status: "missing", errors: ["missing candidate"] });
      totalFacts += expected.required_facts.length;
      totalForbidden += expected.must_not_invent.length;
      continue;
    }

    const layoutCorrect = candidate.layout === expected.expected_layout;
    if (layoutCorrect) layoutHits += 1;
    else errors.push(`layout: expected ${expected.expected_layout}, got ${candidate.layout}`);

    const missingFacts = expected.required_facts.filter((fact) => !contains(candidate, fact));
    const inventedFlags = expected.must_not_invent.filter((fact) => contains(candidate, fact));
    retainedFacts += expected.required_facts.length - missingFacts.length;
    totalFacts += expected.required_facts.length;
    forbiddenHits += inventedFlags.length;
    totalForbidden += expected.must_not_invent.length;
    if (missingFacts.length) errors.push(`missing facts: ${missingFacts.join(" | ")}`);
    if (inventedFlags.length) errors.push(`forbidden claims: ${inventedFlags.join(" | ")}`);

    results.push({
      id: expected.id,
      status: errors.length ? "fail" : "pass",
      layout_correct: layoutCorrect,
      retained_facts: expected.required_facts.length - missingFacts.length,
      total_facts: expected.required_facts.length,
      forbidden_claims: inventedFlags,
      errors
    });
  }

  const total = suite.cases.length;
  const summary = {
    cases: total,
    submitted: submitted.size,
    passed: results.filter((item) => item.status === "pass").length,
    layout_accuracy_percent: Number((layoutHits / total * 100).toFixed(1)),
    fact_retention_percent: Number((retainedFacts / totalFacts * 100).toFixed(1)),
    forbidden_claim_hits: forbiddenHits,
    forbidden_claim_checks: totalForbidden
  };
  return { status: summary.passed === total ? "pass" : "fail", summary, results };
}

async function main() {
  const candidatePath = process.argv[2];
  if (!candidatePath) throw new Error("Usage: node evals/score.mjs <candidate-results.json> [report.json]");
  const suite = JSON.parse(await fs.readFile(SUITE_PATH, "utf8"));
  const submission = JSON.parse(await fs.readFile(path.resolve(candidatePath), "utf8"));
  const report = scoreCandidates(suite, submission);
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (process.argv[3]) await fs.writeFile(path.resolve(process.argv[3]), output, "utf8");
  process.stdout.write(output);
  if (report.status !== "pass") process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`eval-score: ${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
