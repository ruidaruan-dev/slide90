import { addConclusion, addHeader, addLine, addMetricRibbon, addRect, addSourceNotes, addText } from "../common.mjs";
import { COLORS, accent, box, px } from "../theme.mjs";


const ZONES = [
  [58, 270, 570, 136], [652, 270, 570, 136],
  [58, 422, 570, 136], [652, 422, 570, 136]
];


function addResultCard(pptx, slide, block, index, zone) {
  const [x, y, w, h] = zone;
  const token = accent(block.accent || ["blue", "green", "purple", "orange"][index % 4]);
  addRect(pptx, slide, box(zone), COLORS.white, COLORS.rule, 5);
  addRect(pptx, slide, box([x, y, 8, h]), token.strong, null);
  addText(slide, block.title, box([x + 24, y + 14, w - 48, 28]), {
    fontSize: 14.5, bold: true, color: COLORS.navy, valign: "top"
  });
  addText(slide, block.body, box([x + 24, y + 46, w - 48, 38]), {
    fontSize: 11, color: COLORS.gray, valign: "top"
  });
  addLine(pptx, slide, px(x + 24), px(y + 91), px(w - 48), 0, { color: COLORS.rule, width: 0.7 });
  addText(slide, block.evidence, box([x + 24, y + 98, w - 48, 25]), {
    fontSize: 10.5, bold: true, color: token.strong, valign: "top"
  });
}


export function renderPerformanceDashboard(pptx, slide, slideSpec) {
  addHeader(pptx, slide, slideSpec);
  addMetricRibbon(pptx, slide, slideSpec.metrics || [], [58, 180, 1164, 64]);
  slideSpec.blocks.forEach((block, index) => addResultCard(pptx, slide, block, index, ZONES[index]));
  addConclusion(pptx, slide, slideSpec.conclusion);
  addSourceNotes(slide, slideSpec.source_refs || []);
}
