import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";


const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_PATH = path.join(ROOT, "schema", "deck-spec.schema.json");
const GENERIC_TITLES = new Set([
  "项目介绍",
  "工作汇报",
  "能力介绍",
  "未来规划",
  "项目进展",
  "executive summary",
  "project update",
  "overview"
]);

let compiled;


async function validator() {
  if (!compiled) {
    const schema = JSON.parse(await fs.readFile(SCHEMA_PATH, "utf8"));
    const ajv = new Ajv2020({ allErrors: true, strict: false, useDefaults: true });
    compiled = ajv.compile(schema);
  }
  return compiled;
}


function customErrors(spec) {
  const errors = [];
  const numbers = new Set();
  for (const [index, slide] of (spec.slides || []).entries()) {
    if (numbers.has(slide.number)) {
      errors.push({ instancePath: `/slides/${index}/number`, keyword: "duplicate-slide-number", message: "must be unique" });
    }
    numbers.add(slide.number);
    if (GENERIC_TITLES.has(String(slide.title || "").trim().toLowerCase())) {
      errors.push({ instancePath: `/slides/${index}/title`, keyword: "action-title", message: "must state a conclusion, not a topic" });
    }
  }
  return errors;
}


export async function validateDeckSpec(spec) {
  const validate = await validator();
  const validSchema = validate(spec);
  const errors = [...(validate.errors || []), ...customErrors(spec)];
  return { valid: Boolean(validSchema) && errors.length === 0, errors };
}


export function formatValidationErrors(errors) {
  return errors.map((error) => `${error.instancePath || "/"} ${error.message}`).join("\n");
}
