import { addConclusion, addHeader, addLine, addRect, addSourceNotes, addText } from "../common.mjs";
import { COLORS, accent, box, px } from "../theme.mjs";


export function renderSolutionFlow(pptx, slide, slideSpec) {
  addHeader(pptx, slide, slideSpec);
  const gap = 18;
  const count = slideSpec.blocks.length;
  const width = (1164 - gap * (count - 1)) / count;
  const zones = slideSpec.blocks.map((_, index) => [58 + index * (width + gap), 220, width, 320]);
  for (let index = 0; index < zones.length - 1; index += 1) {
    const current = zones[index];
    const next = zones[index + 1];
    addLine(pptx, slide, px(current[0] + current[2]), px(380), px(next[0] - current[0] - current[2]), 0, {
      color: COLORS.orange, width: 1.4, endArrowType: "triangle"
    });
  }
  zones.forEach((zone, index) => {
    const block = slideSpec.blocks[index];
    const [x, y, w, h] = zone;
    const token = accent(block.accent || ["orange", "blue", "green", "purple", "navy"][index % 5]);
    addRect(pptx, slide, box(zone), COLORS.white, COLORS.rule);
    addRect(pptx, slide, box([x, y, w, 8]), token.strong, null);
    addText(slide, block.role, box([x + 14, y + 22, w - 28, 18]), { fontSize: 8.5, bold: true, color: token.strong, valign: "top" });
    addText(slide, block.title, box([x + 14, y + 48, w - 28, 58]), { fontSize: 13.5, bold: true, color: COLORS.navy, valign: "top" });
    addText(slide, block.body, box([x + 14, y + 122, w - 28, 92]), { fontSize: 10.5, color: COLORS.gray, valign: "top", breakLine: true });
    addRect(pptx, slide, box([x + 10, y + 236, w - 20, 62]), token.pale, null);
    addText(slide, block.evidence, box([x + 20, y + 248, w - 40, 36]), { fontSize: 9.5, bold: true, color: token.strong, valign: "mid" });
  });
  addConclusion(pptx, slide, slideSpec.conclusion);
  addSourceNotes(slide, slideSpec.source_refs || []);
}
