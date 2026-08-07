import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import JSZip from "jszip";

import { renderDeckSpec } from "../src/render/index.mjs";
import { validateDeckSpec } from "../src/validate.mjs";


const fixtureUrl = new URL("../examples/project-report/deck-spec.zh-CN.json", import.meta.url);


async function slideXml(filePath) {
  const zip = await JSZip.loadAsync(await fs.readFile(filePath));
  const names = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort();
  return Promise.all(names.map((name) => zip.file(name).async("string")));
}


test("project-report fixture covers five management views and preserves confirmed facts", async () => {
  const spec = JSON.parse(await fs.readFile(fixtureUrl, "utf8"));
  const result = await validateDeckSpec(spec);
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
  assert.deepEqual(spec.slides.map((slide) => slide.layout), [
    "project-charter", "project-health", "milestone-gantt", "raid-table", "solution-flow"
  ]);
  assert.equal(spec.brief.structure_confirmed, true);
});


test("five project-report layouts render as editable square-frame slides", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "slide90-project-render-"));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const spec = JSON.parse(await fs.readFile(fixtureUrl, "utf8"));
  const output = path.join(directory, "project-report.pptx");
  await renderDeckSpec(spec, output);
  const xml = await slideXml(output);
  assert.equal(xml.length, 5);
  assert.ok(xml.every((value) => value.includes("Microsoft YaHei")), "every Chinese slide must declare a CJK font");
  assert.ok(xml.every((value) => (value.match(/<p:sp>/g) || []).length >= 12), "slides must remain editable");
  assert.ok(xml.every((value) => !value.includes('prst="roundRect"')), "management information must use square structural frames");
});


test("milestone gantt rejects reversed and out-of-range periods", async () => {
  const spec = JSON.parse(await fs.readFile(fixtureUrl, "utf8"));
  const reversed = structuredClone(spec);
  reversed.slides[2].blocks[0].start_period = 3;
  reversed.slides[2].blocks[0].end_period = 2;
  assert.match(JSON.stringify((await validateDeckSpec(reversed)).errors), /period-order/);

  const outOfRange = structuredClone(spec);
  outOfRange.slides[2].blocks[0].end_period = 7;
  assert.match(JSON.stringify((await validateDeckSpec(outOfRange)).errors), /period-range|must be <= 6/);
});
