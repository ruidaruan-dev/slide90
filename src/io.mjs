import fs from "node:fs/promises";
import path from "node:path";


export async function readJson(filePath) {
  const absolute = path.resolve(filePath);
  try {
    return JSON.parse(await fs.readFile(absolute, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read JSON from ${absolute}: ${error.message}`);
  }
}


export async function ensureParent(filePath) {
  await fs.mkdir(path.dirname(path.resolve(filePath)), { recursive: true });
}
