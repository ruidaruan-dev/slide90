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

function flattenText(value, seen = new Set()) {
  if (value === null || value === undefined) return "";
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  if (typeof value !== "object" || seen.has(value)) return "";
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => flattenText(item, seen)).join(" ");
  return Object.values(value).map((item) => flattenText(item, seen)).join(" ");
}

function contains(candidate, phrase) {
  const text = normalize(flattenText(candidate));
  const whole = normalize(phrase);
  if (text.includes(whole)) return true;
  const tokens = phrase.split(/[，。；：、,.:%％+—–\-×/（）()\s]/).map(normalize).filter((token) => token.length >= 2);
  return tokens.length > 0 && tokens.every((token) => text.includes(token));
}

function textLeaves(value) {
  if (value === null || value === undefined) return [];
  if (["string", "number", "boolean"].includes(typeof value)) return [String(value)];
  if (Array.isArray(value)) return value.flatMap(textLeaves);
  if (typeof value === "object") return Object.values(value).flatMap(textLeaves);
  return [];
}

function candidateShapeErrors(candidate) {
  const errors = [];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return ["candidate must be an object"];
  if (typeof candidate.id !== "string" || !candidate.id) errors.push("id must be a non-empty string");
  if (typeof candidate.layout !== "string" || !candidate.layout) errors.push("layout must be a non-empty string");
  if (typeof candidate.title !== "string" || !candidate.title.trim()) errors.push("title must be a non-empty string");
  if (!("content" in candidate) || candidate.content === null || candidate.content === undefined) errors.push("content is required");
  return errors;
}

function titleQualityErrors(title) {
  if (typeof title !== "string") return ["title is missing"];
  const clean = title.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const errors = [];
  const generic = /^(overview|summary|update|status|introduction|analysis|plan|roadmap|performance|results|next steps|project update)$/i;
  const assertion = /\b(but|while|because|evidence|meet|double|reduce|increase|decision|before|gate|connect|create|keep|follow|form|require|balance|complement|approve|close|priority|risk|ready|improv|recommend|should|must|enable|drive|need|continue)\w*\b/i;
  if (words.length < 5 || words.length > 24) errors.push("title must contain 5–24 words");
  if (clean.length > 120) errors.push("title exceeds 120 characters");
  if (/^fictional case\b/i.test(clean)) errors.push("title repeats the fixture label instead of stating a conclusion");
  if (generic.test(clean)) errors.push("title is topic-only");
  if (!assertion.test(clean)) errors.push("title lacks a decision, result, contrast, or implication");
  return errors;
}

function isPromptEcho(prompt, content) {
  const promptText = normalize(prompt);
  const contentText = normalize(flattenText(content));
  return promptText.length > 0 && contentText.includes(promptText);
}

function hasContentStructure(content) {
  if (typeof content === "object" && content !== null) return textLeaves(content).filter((item) => item.trim()).length >= 2;
  if (typeof content !== "string") return false;
  return content.split(/\n|[;；]|(?:^|\s)[•*-]\s|[.!?。！？]\s*/).filter((item) => item.trim().length >= 4).length >= 2;
}

export function scoreCandidates(suite, submission) {
  const submitted = new Map((submission.cases || []).map((item) => [item.id, item]));
  const results = [];
  let layoutHits = 0;
  let retainedFacts = 0;
  let totalFacts = 0;
  let forbiddenHits = 0;
  let totalForbidden = 0;
  let validShapes = 0;
  let qualityTitles = 0;
  let structuredContents = 0;
  let promptEchoes = 0;
  let contentRatioTotal = 0;

  for (const expected of suite.cases) {
    const candidate = submitted.get(expected.id);
    const errors = [];
    if (!candidate) {
      results.push({ id: expected.id, status: "missing", errors: ["missing candidate"] });
      totalFacts += expected.required_facts.length;
      totalForbidden += expected.must_not_invent.length;
      continue;
    }

    const shapeErrors = candidateShapeErrors(candidate);
    const titleErrors = titleQualityErrors(candidate.title);
    const promptEcho = isPromptEcho(expected.prompt, candidate.content);
    const structuredContent = hasContentStructure(candidate.content);
    const contentRatio = normalize(flattenText(candidate.content)).length / Math.max(1, normalize(expected.prompt).length);
    if (!shapeErrors.length) validShapes += 1;
    if (!titleErrors.length) qualityTitles += 1;
    if (structuredContent) structuredContents += 1;
    if (promptEcho) promptEchoes += 1;
    contentRatioTotal += contentRatio;
    if (shapeErrors.length) errors.push(`candidate shape: ${shapeErrors.join(" | ")}`);
    if (titleErrors.length) errors.push(`title quality: ${titleErrors.join(" | ")}`);
    if (promptEcho) errors.push("prompt echo: content contains the complete source prompt");
    if (!structuredContent) errors.push("content structure: use at least two meaningful sections or fields");

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
      title_quality: titleErrors.length === 0,
      prompt_echo: promptEcho,
      structured_content: structuredContent,
      content_to_prompt_ratio: Number(contentRatio.toFixed(2)),
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
    forbidden_claim_checks: totalForbidden,
    valid_candidate_percent: Number((validShapes / total * 100).toFixed(1)),
    action_title_percent: Number((qualityTitles / total * 100).toFixed(1)),
    structured_content_percent: Number((structuredContents / total * 100).toFixed(1)),
    prompt_echo_cases: promptEchoes,
    average_content_to_prompt_ratio: Number((contentRatioTotal / total).toFixed(2))
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
