import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import { scoreCandidates } from "../evals/score.mjs";

const casesUrl = new URL("../evals/cases.json", import.meta.url);

test("candidate scorer detects wrong layouts, missing facts, and forbidden claims", async () => {
  const suite = JSON.parse(await fs.readFile(casesUrl, "utf8"));
  const expected = suite.cases[0];
  const submission = {
    cases: [{ id: expected.id, layout: "roadmap", title: "季度复盘", content: `收入12.4亿元；${expected.must_not_invent[0]}` }]
  };
  const report = scoreCandidates({ ...suite, cases: [expected] }, submission);
  assert.equal(report.status, "fail");
  assert.equal(report.summary.layout_accuracy_percent, 0);
  assert.ok(report.summary.fact_retention_percent < 100);
  assert.equal(report.summary.forbidden_claim_hits, 1);
});

test("candidate scorer reads facts from nested WorkBuddy-style content", async () => {
  const suite = JSON.parse(await fs.readFile(casesUrl, "utf8"));
  const expected = suite.cases[0];
  const submission = {
    cases: [{
      id: expected.id,
      layout: expected.expected_layout,
      title: expected.expected_title_intent,
      content: {
        metrics: expected.required_facts.slice(0, 3).map((value) => ({ value })),
        blocks: [{ bullets: expected.required_facts.slice(3) }]
      }
    }]
  };
  const report = scoreCandidates({ ...suite, cases: [expected] }, submission);
  assert.equal(report.status, "pass");
  assert.equal(report.summary.fact_retention_percent, 100);
  assert.equal(report.summary.action_title_percent, 100);
  assert.equal(report.summary.prompt_echo_cases, 0);
});

test("candidate scorer rejects topic-only titles and complete prompt echoes", async () => {
  const suite = JSON.parse(await fs.readFile(casesUrl, "utf8"));
  const expected = suite.cases[0];
  const submission = {
    cases: [{
      id: expected.id,
      layout: expected.expected_layout,
      title: "Performance",
      content: expected.prompt
    }]
  };
  const report = scoreCandidates({ ...suite, cases: [expected] }, submission);
  assert.equal(report.status, "fail");
  assert.equal(report.summary.action_title_percent, 0);
  assert.equal(report.summary.prompt_echo_cases, 1);
  assert.match(report.results[0].errors.join("\n"), /prompt echo/);
});
