import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import { validateDeckSpec } from "../src/validate.mjs";


const fixtureUrl = new URL("../examples/end-to-end/deck-spec.json", import.meta.url);


test("the public end-to-end fixture satisfies the deck-spec contract", async () => {
  const spec = JSON.parse(await fs.readFile(fixtureUrl, "utf8"));
  const result = await validateDeckSpec(spec);
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
});


test("evidence matrices reject unsupported claims", async () => {
  const spec = JSON.parse(await fs.readFile(fixtureUrl, "utf8"));
  delete spec.slides[0].blocks[0].evidence;
  const result = await validateDeckSpec(spec);
  assert.equal(result.valid, false);
  assert.match(JSON.stringify(result.errors), /evidence/);
});


test("duplicate slide numbers are rejected for targeted repair safety", async () => {
  const spec = JSON.parse(await fs.readFile(fixtureUrl, "utf8"));
  spec.slides[1].number = spec.slides[0].number;
  const result = await validateDeckSpec(spec);
  assert.equal(result.valid, false);
  assert.match(JSON.stringify(result.errors), /duplicate-slide-number/);
});
