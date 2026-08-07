import { addConclusion, addHeader, addRect, addSourceNotes, addText } from "../common.mjs";
import { COLORS, accent, box } from "../theme.mjs";


const X = [58, 158, 394, 574, 862, 974, 1082, 1222];


export function renderRaidTable(pptx, slide, slideSpec, language = "en-US") {
  const headers = language.startsWith("zh")
    ? ["类型", "事项", "影响", "措施 / 决策", "负责人", "时间", "状态"]
    : ["TYPE", "ITEM", "IMPACT", "ACTION / DECISION", "OWNER", "DUE", "STATUS"];
  const categoryLabels = language.startsWith("zh")
    ? { risk: "风险", assumption: "假设", issue: "问题", decision: "决策", action: "行动" }
    : { risk: "RISK", assumption: "ASSUMPTION", issue: "ISSUE", decision: "DECISION", action: "ACTION" };
  addHeader(pptx, slide, slideSpec);
  const top = 188;
  const headerHeight = 42;
  const rowHeight = Math.min(48, 328 / slideSpec.blocks.length);
  addRect(pptx, slide, box([58, top, 1164, headerHeight]), COLORS.navy, null);
  headers.forEach((label, index) => addText(slide, label, box([X[index] + 8, top + 11, X[index + 1] - X[index] - 16, 18]), {
    fontSize: 8.8, bold: true, color: COLORS.white
  }));
  slideSpec.blocks.forEach((block, index) => {
    const y = top + headerHeight + index * rowHeight;
    const token = accent(block.accent || ({ risk: "orange", issue: "purple", decision: "blue", action: "green", assumption: "navy" }[block.category]));
    addRect(pptx, slide, box([58, y, 1164, rowHeight]), index % 2 ? COLORS.softGray : COLORS.white, COLORS.rule);
    addRect(pptx, slide, box([X[0] + 8, y + 9, X[1] - X[0] - 16, rowHeight - 18]), token.pale, null);
    addText(slide, categoryLabels[block.category], box([X[0] + 12, y + 10, X[1] - X[0] - 24, rowHeight - 20]), { fontSize: 8.5, bold: true, color: token.strong, align: "center" });
    const values = [block.title, block.impact, block.action, block.owner, block.timing, block.status];
    values.forEach((value, valueIndex) => addText(slide, value, box([X[valueIndex + 1] + 8, y + 6, X[valueIndex + 2] - X[valueIndex + 1] - 16, rowHeight - 8]), {
      fontSize: valueIndex < 3 ? 8.8 : 8.4,
      bold: valueIndex === 0 || valueIndex === 5,
      color: valueIndex === 5 ? token.strong : (valueIndex === 0 ? COLORS.navy : COLORS.gray)
    }));
  });
  addConclusion(pptx, slide, slideSpec.conclusion);
  addSourceNotes(slide, slideSpec.source_refs || []);
}
