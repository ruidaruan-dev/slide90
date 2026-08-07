import { addConclusion, addHeader, addRect, addSourceNotes, addText } from "../common.mjs";
import { COLORS, accent, box } from "../theme.mjs";


function zones(count) {
  const gap = 24;
  const width = (1164 - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => [58 + index * (width + gap), 278, width, 282]);
}


export function renderDecisionPage(pptx, slide, slideSpec, language = "en-US") {
  const recommendationLabel = language.startsWith("zh") ? "管理建议" : "RECOMMENDATION";
  addHeader(pptx, slide, slideSpec);
  addRect(pptx, slide, box([58, 180, 1164, 70]), COLORS.paleBlue, null, 6);
  addText(slide, recommendationLabel, box([78, 194, 150, 18]), { fontSize: 9, bold: true, color: COLORS.brightBlue });
  addText(slide, slideSpec.subtitle || slideSpec.conclusion, box([240, 191, 950, 34]), {
    fontSize: 15, bold: true, color: COLORS.navy
  });
  zones(slideSpec.blocks.length).forEach((zone, index) => {
    const block = slideSpec.blocks[index];
    const [x, y, w, h] = zone;
    const token = accent(block.accent || ["blue", "green", "orange"][index % 3]);
    addRect(pptx, slide, box(zone), COLORS.white, COLORS.rule, 6);
    addText(slide, `0${index + 1}`, box([x + 18, y + 16, 38, 22]), { fontSize: 10, bold: true, color: token.strong });
    addText(slide, block.title, box([x + 18, y + 48, w - 36, 50]), { fontSize: 16, bold: true, color: COLORS.navy, valign: "top" });
    addText(slide, block.body, box([x + 18, y + 112, w - 36, 66]), { fontSize: 11, color: COLORS.gray, valign: "top" });
    addRect(pptx, slide, box([x + 14, y + 194, w - 28, 58]), token.pale, null, 5);
    addText(slide, block.evidence, box([x + 26, y + 205, w - 52, 35]), { fontSize: 10.5, bold: true, color: token.strong, valign: "mid" });
  });
  addConclusion(pptx, slide, slideSpec.conclusion);
  addSourceNotes(slide, slideSpec.source_refs || []);
}
