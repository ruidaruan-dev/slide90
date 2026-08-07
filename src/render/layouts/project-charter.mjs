import { addConclusion, addHeader, addLine, addMetricRibbon, addRect, addSourceNotes, addText } from "../common.mjs";
import { COLORS, accent, box, px } from "../theme.mjs";


const ZONES = [
  [58, 258, 570, 140], [652, 258, 570, 140],
  [58, 418, 570, 140], [652, 418, 570, 140]
];


function addCharterBlock(pptx, slide, block, index, zone) {
  const [x, y, w, h] = zone;
  const token = accent(block.accent || ["blue", "green", "purple", "orange"][index]);
  addRect(pptx, slide, box(zone), COLORS.white, COLORS.rule);
  addRect(pptx, slide, box([x, y, 7, h]), token.strong, null);
  addText(slide, `0${index + 1}`, box([x + 20, y + 14, 32, 18]), { fontSize: 9, bold: true, color: token.strong });
  addText(slide, block.title, box([x + 58, y + 11, w - 78, 28]), { fontSize: 15, bold: true, color: COLORS.navy, valign: "top" });
  addText(slide, block.body, box([x + 20, y + 48, w - 40, 38]), { fontSize: 11, color: COLORS.gray, valign: "top" });
  addLine(pptx, slide, px(x + 20), px(y + 93), px(w - 40), 0, { color: COLORS.rule, width: 0.7 });
  addText(slide, block.evidence, box([x + 20, y + 100, w - 40, 25]), { fontSize: 10.5, bold: true, color: token.strong, valign: "top" });
}


export function renderProjectCharter(pptx, slide, slideSpec) {
  addHeader(pptx, slide, slideSpec);
  addMetricRibbon(pptx, slide, slideSpec.metrics || [], [58, 180, 1164, 58]);
  slideSpec.blocks.forEach((block, index) => addCharterBlock(pptx, slide, block, index, ZONES[index]));
  addConclusion(pptx, slide, slideSpec.conclusion);
  addSourceNotes(slide, slideSpec.source_refs || []);
}
