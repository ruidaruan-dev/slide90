import { addConclusion, addHeader, addLine, addMetricRibbon, addRect, addSourceNotes, addText } from "../common.mjs";
import { COLORS, accent, box, px } from "../theme.mjs";


const CARD_ZONES = [
  [58, 264, 570, 136],
  [652, 264, 570, 136],
  [58, 420, 570, 136],
  [652, 420, 570, 136]
];


function addEvidenceCard(pptx, slide, block, index, zone) {
  const [x, y, w, h] = zone;
  const token = accent(block.accent || ["blue", "green", "purple", "orange"][index % 4]);
  addRect(pptx, slide, box(zone), COLORS.white, COLORS.rule, 5);
  addRect(pptx, slide, box([x, y, 7, h]), token.strong, null);

  addText(slide, String(index + 1).padStart(2, "0"), box([x + 20, y + 13, 28, 20]), {
    fontSize: 9,
    bold: true,
    color: token.strong,
    valign: "top"
  });
  addText(slide, block.title, box([x + 54, y + 10, w - 74, 28]), {
    fontSize: 15,
    bold: true,
    color: COLORS.navy,
    valign: "top"
  });

  addText(slide, [
    { text: "REQUIREMENT  ", options: { bold: true, color: COLORS.faint } },
    { text: block.body || "", options: { color: COLORS.gray } }
  ], box([x + 20, y + 43, w - 40, 30]), {
    fontSize: 11,
    valign: "top",
    breakLine: false
  });

  addLine(pptx, slide, px(x + 20), px(y + 78), px(w - 40), 0, { color: COLORS.rule, width: 0.7 });
  addText(slide, [
    { text: "DIRECT EVIDENCE  ", options: { bold: true, color: token.strong } },
    { text: block.evidence || "", options: { color: COLORS.ink, bold: true } }
  ], box([x + 20, y + 84, w - 40, 30]), {
    fontSize: 11,
    valign: "top",
    breakLine: false
  });

  if (block.proof?.length) {
    addRect(pptx, slide, box([x + 14, y + h - 20, w - 28, 15]), token.pale, null, 3);
    addText(slide, block.proof.join("  |  "), box([x + 24, y + h - 19, w - 48, 13]), {
      fontSize: 8.2,
      bold: true,
      color: token.strong
    });
  }
}


export function renderEvidenceMatrix(pptx, slide, slideSpec) {
  addHeader(pptx, slide, slideSpec);
  addMetricRibbon(pptx, slide, slideSpec.metrics || []);
  slideSpec.blocks.forEach((block, index) => addEvidenceCard(pptx, slide, block, index, CARD_ZONES[index]));
  addConclusion(pptx, slide, slideSpec.conclusion);
  addSourceNotes(slide, slideSpec.source_refs || []);
}
