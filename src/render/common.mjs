import { COLORS, FONT_FACE, FONT_FACE_CJK, accent, box, px } from "./theme.mjs";


function textValue(text) {
  if (Array.isArray(text)) return text.map((part) => part?.text || "").join("");
  return String(text || "");
}


function fontFor(text) {
  return /[\u3400-\u9fff\uf900-\ufaff]/u.test(textValue(text)) ? FONT_FACE_CJK : FONT_FACE;
}


export function addText(slide, text, position, options = {}) {
  slide.addText(text, {
    ...position,
    fontFace: fontFor(text),
    color: COLORS.ink,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    valign: "mid",
    ...options
  });
}


export function addRect(pptx, slide, position, fill, line = COLORS.rule, _radius = 0) {
  slide.addShape(pptx.ShapeType.rect, {
    ...position,
    fill: { color: fill },
    line: line ? { color: line, width: 0.8 } : { color: fill, transparency: 100 }
  });
}


export function addLine(pptx, slide, x, y, w, h, options = {}) {
  slide.addShape(pptx.ShapeType.line, {
    x,
    y,
    w,
    h,
    line: { color: COLORS.rule, width: 1, ...options }
  });
}


export function addHeader(pptx, slide, slideSpec) {
  slide.background = { color: COLORS.white };
  addText(slide, slideSpec.section || `SLIDE ${String(slideSpec.number).padStart(2, "0")}`, box([58, 28, 1164, 20]), {
    fontSize: 10,
    bold: true,
    color: COLORS.orange,
    charSpacing: 0.4
  });
  addText(slide, slideSpec.title, box([58, 54, 1164, 72]), {
    fontSize: 27,
    bold: true,
    color: COLORS.navy,
    valign: "top"
  });
  addLine(pptx, slide, px(58), px(137), px(1164), 0, { color: COLORS.rule, width: 1.1 });
  if (slideSpec.subtitle) {
    addText(slide, slideSpec.subtitle, box([58, 145, 1164, 24]), {
      fontSize: 11.5,
      color: COLORS.gray,
      valign: "top"
    });
  }
}


export function addMetricRibbon(pptx, slide, metrics = [], frame = [58, 180, 1164, 64]) {
  if (!metrics.length) return;
  const [x, y, w, h] = frame;
  const gap = 10;
  const width = (w - gap * (metrics.length - 1)) / metrics.length;
  metrics.forEach((metric, index) => {
    const token = accent(metric.accent || ["blue", "green", "orange", "purple", "navy"][index % 5]);
    const left = x + index * (width + gap);
    addRect(pptx, slide, box([left, y, width, h]), token.pale, null, 6);
    addText(slide, metric.value, box([left + 14, y + 8, width - 28, 25]), {
      fontSize: 18,
      bold: true,
      color: token.strong,
      valign: "top"
    });
    addText(slide, metric.label, box([left + 14, y + 35, width - 28, 18]), {
      fontSize: 9.5,
      bold: true,
      color: COLORS.navy,
      valign: "top"
    });
  });
}


export function addConclusion(pptx, slide, text) {
  if (!text) return;
  addRect(pptx, slide, box([58, 590, 1164, 82]), COLORS.navy, null, 6);
  addText(slide, text, box([84, 604, 1112, 52]), {
    fontSize: 16,
    bold: true,
    color: COLORS.white,
    valign: "mid"
  });
}


export function addSourceNotes(slide, sourceRefs = []) {
  const notes = sourceRefs.length ? sourceRefs.map((source) => `- ${source}`).join("\n") : "- Synthetic example; no external sources.";
  slide.addNotes(`[Sources]\n${notes}`);
}
