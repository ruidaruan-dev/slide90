import { addConclusion, addHeader, addRect, addSourceNotes, addText } from "../common.mjs";
import { COLORS, accent, box } from "../theme.mjs";


const X = [58, 338, 510, 668, 814, 1222];
export function renderPortfolioTable(pptx, slide, slideSpec, language = "en-US") {
  const headers = language.startsWith("zh")
    ? ["项目", "负责人", "时间", "状态", "交付 / 价值"]
    : ["INITIATIVE", "OWNER", "TIMING", "STATUS", "DELIVERY / VALUE"];
  addHeader(pptx, slide, slideSpec);
  const top = 188;
  const headerHeight = 44;
  const rowHeight = Math.min(50, 328 / slideSpec.blocks.length);
  addRect(pptx, slide, box([58, top, 1164, headerHeight]), COLORS.navy, null, 4);
  headers.forEach((label, index) => addText(slide, label, box([X[index] + 12, top + 12, X[index + 1] - X[index] - 24, 18]), {
    fontSize: 9.5, bold: true, color: COLORS.white, valign: "top"
  }));

  slideSpec.blocks.forEach((block, index) => {
    const y = top + headerHeight + index * rowHeight;
    const token = accent(block.accent || ["blue", "green", "purple", "orange"][index % 4]);
    addRect(pptx, slide, box([58, y, 1164, rowHeight]), index % 2 ? COLORS.softGray : COLORS.white, COLORS.rule);
    addText(slide, block.title, box([70, y + 8, 256, rowHeight - 12]), { fontSize: 10.5, bold: true, color: COLORS.navy });
    addText(slide, block.owner, box([350, y + 8, 148, rowHeight - 12]), { fontSize: 9.5, color: COLORS.gray });
    addText(slide, block.timing, box([522, y + 8, 134, rowHeight - 12]), { fontSize: 9.5, bold: true, color: COLORS.navy });
    addRect(pptx, slide, box([680, y + 10, 122, rowHeight - 20]), token.pale, null, 4);
    addText(slide, block.status, box([688, y + 11, 106, rowHeight - 22]), { fontSize: 9, bold: true, color: token.strong, align: "center" });
    addText(slide, block.evidence || block.body, box([826, y + 7, 382, rowHeight - 10]), { fontSize: 9.5, color: COLORS.ink });
  });
  addConclusion(pptx, slide, slideSpec.conclusion);
  addSourceNotes(slide, slideSpec.source_refs || []);
}
