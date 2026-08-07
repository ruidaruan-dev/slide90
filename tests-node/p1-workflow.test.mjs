import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import JSZip from "jszip";

import { renderDeckSpec } from "../src/render/index.mjs";
import { validateDeckSpec } from "../src/validate.mjs";


const fixtureUrl = new URL("../examples/p1/deck-spec.zh-CN.json", import.meta.url);
const replacementUrl = new URL("../examples/p1/replacement-slide-5.zh-CN.json", import.meta.url);
const root = path.resolve(new URL("..", import.meta.url).pathname);


async function slideXml(filePath) {
  const zip = await JSZip.loadAsync(await fs.readFile(filePath));
  const names = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort();
  return Promise.all(names.map((name) => zip.file(name).async("string")));
}


test("P1 Chinese fixture preserves the confirmed structure and all must-keep facts", async () => {
  const spec = JSON.parse(await fs.readFile(fixtureUrl, "utf8"));
  const result = await validateDeckSpec(spec);
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
  assert.equal(spec.brief.structure_confirmed, true);
  assert.equal(new Set(spec.slides.map((slide) => slide.layout)).size, 6);

  const missing = structuredClone(spec);
  missing.brief.must_keep_facts.push("虚构但必须保留的缺失事实");
  const failed = await validateDeckSpec(missing);
  assert.equal(failed.valid, false);
  assert.match(JSON.stringify(failed.errors), /must-keep-fact/);
});


test("six high-frequency layouts render as one editable Chinese deck", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "slide90-p1-render-"));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const spec = JSON.parse(await fs.readFile(fixtureUrl, "utf8"));
  const output = path.join(directory, "deck.pptx");
  await renderDeckSpec(spec, output);
  const xml = await slideXml(output);
  assert.equal(xml.length, 6);
  assert.ok(xml.every((value) => value.includes("Microsoft YaHei")), "every Chinese slide must declare a CJK font");
  assert.ok(xml.every((value) => (value.match(/<p:sp>/g) || []).length >= 12), "slides must remain editable");
});


test("single-page rendering and targeted replacement preserve unaffected pages", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "slide90-p1-repair-"));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const input = path.resolve(fixtureUrl.pathname);
  const replacement = path.resolve(replacementUrl.pathname);
  const full = path.join(directory, "full.pptx");
  const single = path.join(directory, "single.pptx");
  const updated = path.join(directory, "updated.pptx");
  const updatedSpec = path.join(directory, "updated.json");

  for (const args of [
    ["bin/slide90.mjs", "render", input, "--output", full],
    ["bin/slide90.mjs", "render-slide", input, "--slide", "3", "--output", single],
    ["bin/slide90.mjs", "replace-slide", input, "--slide", "5", "--with", replacement, "--spec-output", updatedSpec, "--output", updated]
  ]) {
    const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }

  assert.equal((await slideXml(single)).length, 1);
  const before = await slideXml(full);
  const after = await slideXml(updated);
  assert.equal(after.length, 6);
  for (const index of [0, 1, 2, 3, 5]) assert.equal(after[index], before[index], `slide ${index + 1} changed unexpectedly`);
  assert.notEqual(after[4], before[4], "slide 5 should be replaced");
});
