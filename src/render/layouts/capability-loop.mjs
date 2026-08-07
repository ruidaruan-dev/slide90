import { addConclusion, addHeader, addLine, addMetricRibbon, addRect, addSourceNotes, addText } from "../common.mjs";
import { COLORS, accent, box, px } from "../theme.mjs";


function cardPositions(blocks) {
  const business = blocks.filter((block) => block.group === "business");
  const internal = blocks.filter((block) => block.group !== "business");
  const positions = new Map();

  const businessGap = 14;
  const businessWidth = (302 - businessGap * Math.max(0, business.length - 1)) / Math.max(1, business.length);
  business.forEach((block, index) => positions.set(block.id, [72 + index * (businessWidth + businessGap), 314, businessWidth, 200]));

  const internalGap = 14;
  const internalWidth = (786 - internalGap * Math.max(0, internal.length - 1)) / Math.max(1, internal.length);
  internal.forEach((block, index) => positions.set(block.id, [420 + index * (internalWidth + internalGap), 314, internalWidth, 200]));
  return positions;
}


function addRoleCard(pptx, slide, block, zone) {
  const [x, y, w, h] = zone;
  const token = accent(block.accent || (block.group === "business" ? "orange" : "blue"));
  addRect(pptx, slide, box(zone), COLORS.white, COLORS.rule, 5);
  addRect(pptx, slide, box([x, y, w, 7]), token.strong, null);
  addText(slide, (block.role || block.group || "ROLE").toUpperCase(), box([x + 14, y + 18, w - 28, 18]), {
    fontSize: 8.5,
    bold: true,
    color: token.strong,
    valign: "top"
  });
  addText(slide, block.title, box([x + 14, y + 40, w - 28, 58]), {
    fontSize: 12.8,
    bold: true,
    color: COLORS.navy,
    valign: "top"
  });
  addLine(pptx, slide, px(x + 14), px(y + 105), px(w - 28), 0, { color: COLORS.rule, width: 0.7 });
  addText(slide, block.body, box([x + 14, y + 113, w - 28, 70]), {
    fontSize: 11,
    color: COLORS.gray,
    valign: "top",
    breakLine: true,
    bullet: block.body.includes("\n") ? { type: "bullet" } : undefined
  });
}


export function renderCapabilityLoop(pptx, slide, slideSpec) {
  addHeader(pptx, slide, slideSpec);
  addMetricRibbon(pptx, slide, slideSpec.metrics || [], [58, 180, 1164, 58]);

  addRect(pptx, slide, box([58, 258, 330, 302]), COLORS.paleOrange, null, 5);
  addRect(pptx, slide, box([404, 258, 818, 302]), COLORS.paleBlue, null, 5);
  addText(slide, "BUSINESS NETWORK", box([76, 276, 290, 24]), { fontSize: 10, bold: true, color: COLORS.orange });
  addText(slide, "INTERNAL DELIVERY CHAIN", box([424, 276, 760, 24]), { fontSize: 10, bold: true, color: COLORS.mutedBlue });

  const positions = cardPositions(slideSpec.blocks);
  const ordered = slideSpec.blocks.map((block) => ({ block, zone: positions.get(block.id) }));

  // Connectors first so every arrow remains behind the role cards.
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const current = ordered[index].zone;
    const next = ordered[index + 1].zone;
    const x1 = px(current[0] + current[2]);
    const x2 = px(next[0]);
    const y = px(current[1] + current[3] / 2);
    addLine(pptx, slide, x1, y, x2 - x1, 0, { color: COLORS.orange, width: 1.4, endArrowType: "triangle" });
  }
  addLine(pptx, slide, px(130), px(526), px(1050), 0, { color: COLORS.orange, width: 1.2, beginArrowType: "triangle" });

  ordered.forEach(({ block, zone }) => addRoleCard(pptx, slide, block, zone));
  addText(slide, "Feedback: adoption  ·  quality  ·  business value", box([390, 528, 500, 22]), {
    fontSize: 9.5,
    bold: true,
    color: COLORS.orange,
    align: "center"
  });
  addConclusion(pptx, slide, slideSpec.conclusion);
  addSourceNotes(slide, slideSpec.source_refs || []);
}
