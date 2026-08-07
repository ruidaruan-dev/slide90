import { addConclusion, addHeader, addRect, addSourceNotes, addText } from "../common.mjs";
import { COLORS, accent, box } from "../theme.mjs";


function zones(count) {
  const gap = 24;
  const width = (1164 - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => [58 + index * (width + gap), 190, width, 370]);
}


function addPhase(pptx, slide, block, index, zone, labels) {
  const [x, y, w, h] = zone;
  const token = accent(block.accent || ["blue", "purple", "green"][index % 3]);
  addRect(pptx, slide, box(zone), COLORS.white, COLORS.rule, 6);
  addRect(pptx, slide, box([x, y, w, 54]), token.strong, null, 6);
  addText(slide, `${labels.phase} ${index + 1}`, box([x + 18, y + 10, 92, 16]), {
    fontSize: 9, bold: true, color: COLORS.white, valign: "top"
  });
  addText(slide, block.timing, box([x + 18, y + 28, w - 36, 16]), {
    fontSize: 10, bold: true, color: COLORS.white, valign: "top"
  });
  addText(slide, block.title, box([x + 18, y + 72, w - 36, 48]), {
    fontSize: 17, bold: true, color: COLORS.navy, valign: "top"
  });
  addText(slide, block.body, box([x + 18, y + 132, w - 36, 104]), {
    fontSize: 11.5, color: COLORS.gray, valign: "top", breakLine: true
  });
  if (block.evidence) {
    addRect(pptx, slide, box([x + 14, y + 252, w - 28, 76]), token.pale, null, 5);
    addText(slide, labels.deliverable, box([x + 28, y + 264, w - 56, 16]), {
      fontSize: 8.5, bold: true, color: token.strong, valign: "top"
    });
    addText(slide, block.evidence, box([x + 28, y + 284, w - 56, 32]), {
      fontSize: 10.5, bold: true, color: COLORS.navy, valign: "top"
    });
  }
}


export function renderRoadmap(pptx, slide, slideSpec, language = "en-US") {
  const labels = language.startsWith("zh")
    ? { phase: "阶段", deliverable: "阶段交付" }
    : { phase: "PHASE", deliverable: "DELIVERABLE" };
  addHeader(pptx, slide, slideSpec);
  zones(slideSpec.blocks.length).forEach((zone, index) => addPhase(pptx, slide, slideSpec.blocks[index], index, zone, labels));
  addConclusion(pptx, slide, slideSpec.conclusion);
  addSourceNotes(slide, slideSpec.source_refs || []);
}
