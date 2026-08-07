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
