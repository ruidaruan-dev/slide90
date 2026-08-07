import { addConclusion, addHeader, addLine, addMetricRibbon, addRect, addSourceNotes, addText } from "../common.mjs";
import { COLORS, accent, box, px } from "../theme.mjs";


const ZONES = [
  [58, 274, 570, 132], [652, 274, 570, 132],
  [58, 424, 570, 132], [652, 424, 570, 132]
];


function addManagementBlock(pptx, slide, block, index, zone) {
  const [x, y, w, h] = zone;
  const token = accent(block.accent || ["blue", "orange", "green", "purple"][index]);
  addRect(pptx, slide, box(zone), COLORS.white, COLORS.rule);
  addRect(pptx, slide, box([x, y, 7, h]), token.strong, null);
  addText(slide, block.title, box([x + 22, y + 14, w - 44, 25]), { fontSize: 14.5, bold: true, color: COLORS.navy, valign: "top" });
  addText(slide, block.body, box([x + 22, y + 44, w - 44, 34]), { fontSize: 10.8, color: COLORS.gray, valign: "top" });
  addLine(pptx, slide, px(x + 22), px(y + 85), px(w - 44), 0, { color: COLORS.rule, width: 0.7 });
  addText(slide, block.evidence, box([x + 22, y + 92, w - 44, 24]), { fontSize: 10.5, bold: true, color: token.strong });
}


export function renderProjectHealth(pptx, slide, slideSpec) {
  addHeader(pptx, slide, slideSpec);
  addMetricRibbon(pptx, slide, slideSpec.metrics || [], [58, 180, 1164, 68]);
  slideSpec.blocks.forEach((block, index) => addManagementBlock(pptx, slide, block, index, ZONES[index]));
  addConclusion(pptx, slide, slideSpec.conclusion);
  addSourceNotes(slide, slideSpec.source_refs || []);
}
