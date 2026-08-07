import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { renderDeckSpec } from "../src/render/index.mjs";


const fixtureUrl = new URL("../examples/end-to-end/deck-spec.json", import.meta.url);


test("both P0 layouts render into one editable PPTX package", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "slide90-render-"));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const spec = JSON.parse(await fs.readFile(fixtureUrl, "utf8"));
  const output = path.join(directory, "deck.pptx");

  await renderDeckSpec(spec, output);
  const data = await fs.readFile(output);

  assert.equal(data.subarray(0, 2).toString(), "PK");
  assert.ok(data.length > 20_000, `PPTX package is unexpectedly small: ${data.length}`);
  assert.ok(data.includes(Buffer.from("ppt/slides/slide1.xml")), "slide 1 is missing from the PPTX package");
  assert.ok(data.includes(Buffer.from("ppt/slides/slide2.xml")), "slide 2 is missing from the PPTX package");
});
