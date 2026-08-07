import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import { validateEvalSuite } from "../evals/validate.mjs";

const casesUrl = new URL("../evals/cases.json", import.meta.url);

test("core eval suite has three grounded cases for every management layout", async () => {
  const suite = JSON.parse(await fs.readFile(casesUrl, "utf8"));
  const result = await validateEvalSuite(suite);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.summary.cases, 24);
  assert.equal(result.summary.layouts, 8);
  assert.ok(Object.values(result.summary.cases_per_layout).every((count) => count === 3));
});

test("eval validator rejects duplicate cases and unbalanced layouts", async () => {
  const suite = JSON.parse(await fs.readFile(casesUrl, "utf8"));
  suite.cases[1].id = suite.cases[0].id;
  suite.cases[1].category = "evidence-matrix";
  suite.cases[1].expected_layout = "evidence-matrix";
  const result = await validateEvalSuite(suite);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /duplicate case id/);
  assert.match(result.errors.join("\n"), /performance-dashboard: expected 3 cases, found 2/);
});
