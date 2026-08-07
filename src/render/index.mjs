import path from "node:path";

import pptxgen from "pptxgenjs";

import { ensureParent } from "../io.mjs";
import { renderCapabilityLoop } from "./layouts/capability-loop.mjs";
import { renderDecisionPage } from "./layouts/decision-page.mjs";
import { renderEvidenceMatrix } from "./layouts/evidence-matrix.mjs";
import { renderPerformanceDashboard } from "./layouts/performance-dashboard.mjs";
import { renderPortfolioTable } from "./layouts/portfolio-table.mjs";
import { renderProjectCharter } from "./layouts/project-charter.mjs";
import { renderProjectHealth } from "./layouts/project-health.mjs";
import { renderMilestoneGantt } from "./layouts/milestone-gantt.mjs";
import { renderRaidTable } from "./layouts/raid-table.mjs";
import { renderRoadmap } from "./layouts/roadmap.mjs";
import { renderSolutionFlow } from "./layouts/solution-flow.mjs";


export const SUPPORTED_LAYOUTS = new Set([
  "performance-dashboard",
  "evidence-matrix",
  "roadmap",
  "capability-loop",
  "portfolio-table",
  "decision-page",
  "project-charter",
  "project-health",
  "milestone-gantt",
  "raid-table",
  "solution-flow"
]);


export async function renderDeckSpec(spec, outputPath) {
  const unsupported = [...new Set(spec.slides.map((slide) => slide.layout).filter((layout) => !SUPPORTED_LAYOUTS.has(layout)))];
  if (unsupported.length) {
    throw new Error(`Renderer does not yet support: ${unsupported.join(", ")}`);
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
    const language = spec.language || "en-US";
    if (slideSpec.layout === "performance-dashboard") renderPerformanceDashboard(pptx, slide, slideSpec, language);
    if (slideSpec.layout === "evidence-matrix") renderEvidenceMatrix(pptx, slide, slideSpec, language);
    if (slideSpec.layout === "roadmap") renderRoadmap(pptx, slide, slideSpec, language);
    if (slideSpec.layout === "capability-loop") renderCapabilityLoop(pptx, slide, slideSpec, language);
    if (slideSpec.layout === "portfolio-table") renderPortfolioTable(pptx, slide, slideSpec, language);
    if (slideSpec.layout === "decision-page") renderDecisionPage(pptx, slide, slideSpec, language);
    if (slideSpec.layout === "project-charter") renderProjectCharter(pptx, slide, slideSpec, language);
    if (slideSpec.layout === "project-health") renderProjectHealth(pptx, slide, slideSpec, language);
    if (slideSpec.layout === "milestone-gantt") renderMilestoneGantt(pptx, slide, slideSpec, language);
    if (slideSpec.layout === "raid-table") renderRaidTable(pptx, slide, slideSpec, language);
    if (slideSpec.layout === "solution-flow") renderSolutionFlow(pptx, slide, slideSpec, language);
  }

  const absolute = path.resolve(outputPath);
  await ensureParent(absolute);
  await pptx.writeFile({ fileName: absolute, compression: true });
  return absolute;
}
