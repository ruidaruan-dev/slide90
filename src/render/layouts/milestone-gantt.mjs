import { addConclusion, addHeader, addRect, addSourceNotes, addText } from "../common.mjs";
import { COLORS, accent, box } from "../theme.mjs";


export function renderMilestoneGantt(pptx, slide, slideSpec, language = "en-US") {
  addHeader(pptx, slide, slideSpec);
  const labels = language.startsWith("zh") ? ["工作流 / 里程碑", "负责人"] : ["WORKSTREAM / MILESTONE", "OWNER"];
  const top = 188;
  const headerHeight = 44;
  const left = 58;
  const nameWidth = 248;
  const ownerWidth = 132;
  const timelineX = left + nameWidth + ownerWidth;
  const timelineWidth = 1164 - nameWidth - ownerWidth;
  const periodWidth = timelineWidth / slideSpec.periods.length;
  const rowHeight = Math.min(50, 328 / slideSpec.blocks.length);

  addRect(pptx, slide, box([left, top, 1164, headerHeight]), COLORS.navy, null);
  addText(slide, labels[0], box([left + 12, top + 12, nameWidth - 24, 18]), { fontSize: 9.2, bold: true, color: COLORS.white });
  addText(slide, labels[1], box([left + nameWidth + 12, top + 12, ownerWidth - 24, 18]), { fontSize: 9.2, bold: true, color: COLORS.white });
  slideSpec.periods.forEach((period, index) => addText(slide, period, box([timelineX + index * periodWidth, top + 12, periodWidth, 18]), {
    fontSize: 8.8, bold: true, color: COLORS.white, align: "center"
  }));

  slideSpec.blocks.forEach((block, index) => {
    const y = top + headerHeight + index * rowHeight;
    const token = accent(block.accent || ["blue", "green", "purple", "orange"][index % 4]);
    addRect(pptx, slide, box([left, y, 1164, rowHeight]), index % 2 ? COLORS.softGray : COLORS.white, COLORS.rule);
    addText(slide, block.title, box([left + 12, y + 7, nameWidth - 24, rowHeight - 10]), { fontSize: 9.8, bold: true, color: COLORS.navy });
    addText(slide, block.owner, box([left + nameWidth + 12, y + 7, ownerWidth - 24, rowHeight - 10]), { fontSize: 9.2, color: COLORS.gray });
    for (let period = 1; period < slideSpec.periods.length; period += 1) {
      addRect(pptx, slide, box([timelineX + period * periodWidth, y, 1, rowHeight]), COLORS.rule, null);
    }
    const barX = timelineX + (block.start_period - 1) * periodWidth + 5;
    const barW = (block.end_period - block.start_period + 1) * periodWidth - 10;
    addRect(pptx, slide, box([barX, y + 10, barW, rowHeight - 20]), token.strong, null);
    addText(slide, block.status, box([barX + 6, y + 11, barW - 12, rowHeight - 22]), {
      fontSize: 8.5, bold: true, color: COLORS.white, align: "center"
    });
  });
  addConclusion(pptx, slide, slideSpec.conclusion);
  addSourceNotes(slide, slideSpec.source_refs || []);
}
