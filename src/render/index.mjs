import path from "node:path";

import pptxgen from "pptxgenjs";

import { ensureParent } from "../io.mjs";
import { renderCapabilityLoop } from "./layouts/capability-loop.mjs";
import { renderEvidenceMatrix } from "./layouts/evidence-matrix.mjs";


export const SUPPORTED_LAYOUTS = new Set(["evidence-matrix", "capability-loop"]);


export async function renderDeckSpec(spec, outputPath) {
  const unsupported = [...new Set(spec.slides.map((slide) => slide.layout).filter((layout) => !SUPPORTED_LAYOUTS.has(layout)))];
  if (unsupported.length) {
    throw new Error(`P0 renderer does not yet support: ${unsupported.join(", ")}`);
  }

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Slide90";
  pptx.company = "Slide90 open-source project";
  pptx.subject = spec.decision || spec.deck_title;
  pptx.title = spec.deck_title;
  pptx.lang = spec.language || "en-US";
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
    lang: spec.language || "en-US"
  };

  for (const slideSpec of spec.slides) {
    const slide = pptx.addSlide();
    if (slideSpec.layout === "evidence-matrix") renderEvidenceMatrix(pptx, slide, slideSpec);
    if (slideSpec.layout === "capability-loop") renderCapabilityLoop(pptx, slide, slideSpec);
  }

  const absolute = path.resolve(outputPath);
  await ensureParent(absolute);
  await pptx.writeFile({ fileName: absolute, compression: true });
  return absolute;
}
