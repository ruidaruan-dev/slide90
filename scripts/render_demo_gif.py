#!/usr/bin/env python3
"""Render the deterministic Slide90 homepage demo GIF."""

from __future__ import annotations

from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "slide90-demo.gif"
POSTER = ROOT / "assets" / "slide90-demo-poster.png"
WIDTH, HEIGHT = 1280, 720

NAVY = "#0B1F33"
BLUE = "#1F5FBF"
PALE_BLUE = "#EAF2FB"
ORANGE = "#EB7625"
PALE_ORANGE = "#FFF1E8"
GREEN = "#14866D"
PALE_GREEN = "#E8F6F2"
PURPLE = "#7055D9"
PALE_PURPLE = "#F0EDFF"
INK = "#172033"
MUTED = "#667387"
LINE = "#D7DEE8"
PAPER = "#FFFFFF"
SOFT = "#F5F7FA"

FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def rr(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def label(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, size: int, color: str = INK, bold: bool = False, anchor: str | None = None) -> None:
    draw.text(xy, text, font=font(size, bold), fill=color, anchor=anchor)


def fit_lines(text: str, width: int) -> list[str]:
    return wrap(text, width=width, break_long_words=False)


def wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, chars: int, size: int, color: str = MUTED, bold: bool = False, spacing: int = 8) -> None:
    draw.multiline_text(xy, "\n".join(fit_lines(text, chars)), font=font(size, bold), fill=color, spacing=spacing)


def header(draw: ImageDraw.ImageDraw, active: int, title: str, kicker: str) -> None:
    label(draw, (54, 34), "SLIDE", 24, NAVY, True)
    label(draw, (147, 34), "90", 24, ORANGE, True)
    label(draw, (54, 80), kicker.upper(), 13, ORANGE, True)
    label(draw, (54, 108), title, 34, NAVY, True)
    draw.line((54, 158, 1226, 158), fill=LINE, width=2)

    steps = ["RAW INPUT", "PLAN ONCE", "BATCH", "REPAIR ONLY", "DECISION READY"]
    x = 54
    widths = [170, 184, 154, 200, 226]
    for index, (step, w) in enumerate(zip(steps, widths), start=1):
        fill = NAVY if index == active else SOFT
        color = PAPER if index == active else MUTED
        rr(draw, (x, 650, x + w, 688), 8, fill)
        label(draw, (x + 16, 669), f"{index:02d}  {step}", 12, color, True, "lm")
        x += w + 12


def note_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], heading: str, lines: list[str], accent: str) -> None:
    rr(draw, box, 14, PAPER, LINE)
    x1, y1, x2, y2 = box
    draw.rectangle((x1, y1, x1 + 7, y2), fill=accent)
    label(draw, (x1 + 24, y1 + 20), heading, 17, NAVY, True)
    y = y1 + 58
    for line in lines:
        draw.ellipse((x1 + 25, y + 7, x1 + 31, y + 13), fill=accent)
        wrapped(draw, (x1 + 42, y), line, 35, 15, MUTED, spacing=4)
        y += 48


def mini_slide(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], variant: int, selected: bool = False, locked: bool = False) -> None:
    x1, y1, x2, y2 = box
    rr(draw, box, 10, PAPER, ORANGE if selected else LINE, 4 if selected else 1)
    draw.rectangle((x1 + 16, y1 + 15, x1 + 90, y1 + 20), fill=ORANGE)
    draw.rectangle((x1 + 16, y1 + 30, x2 - 16, y1 + 42), fill=NAVY)
    if variant % 4 == 0:
        for i, color in enumerate((PALE_BLUE, PALE_GREEN, PALE_ORANGE)):
            xx = x1 + 16 + i * ((x2 - x1 - 44) // 3)
            draw.rectangle((xx, y1 + 60, xx + 56, y2 - 18), fill=color)
    elif variant % 4 == 1:
        draw.rectangle((x1 + 16, y1 + 60, x1 + 72, y2 - 18), fill=PALE_ORANGE)
        draw.rectangle((x1 + 82, y1 + 60, x2 - 16, y2 - 18), fill=PALE_BLUE)
        for yy in range(y1 + 74, y2 - 24, 22):
            draw.line((x1 + 92, yy, x2 - 28, yy), fill=BLUE, width=3)
    elif variant % 4 == 2:
        draw.rectangle((x1 + 16, y1 + 60, x2 - 16, y1 + 82), fill=PALE_GREEN)
        for i in range(4):
            xx = x1 + 16 + i * ((x2 - x1 - 40) // 4)
            draw.rectangle((xx, y1 + 94, xx + 42, y2 - 18), fill=SOFT)
            draw.rectangle((xx, y1 + 94, xx + 42, y1 + 101), fill=(BLUE, GREEN, PURPLE, ORANGE)[i])
    else:
        for i in range(3):
            xx = x1 + 16 + i * ((x2 - x1 - 40) // 3)
            draw.rectangle((xx, y1 + 60, xx + 54, y2 - 18), fill=(PALE_BLUE, PALE_GREEN, PALE_PURPLE)[i])
    if locked:
        rr(draw, (x2 - 42, y1 + 10, x2 - 12, y1 + 38), 8, NAVY)
        label(draw, (x2 - 27, y1 + 25), "✓", 15, PAPER, True, "mm")


def stage_input() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    d = ImageDraw.Draw(img)
    header(d, 1, "Messy business material goes in", "From fragments to a management question")
    note_card(d, (54, 192, 470, 610), "Quarterly notes", ["AI pilots across seven departments", "20+ demands with uneven evidence", "Security and data constraints", "Need a Q4 scale-up decision"], ORANGE)
    rr(d, (500, 192, 1226, 610), 16, SOFT)
    label(d, (540, 230), "Unstructured input", 17, MUTED, True)
    fragments = [
        ((540, 278, 820, 346), PALE_BLUE, "Metrics: 1,200 h/month"),
        ((848, 278, 1178, 346), PALE_ORANGE, "Problem: no shared priority"),
        ((540, 370, 920, 438), PALE_GREEN, "Plan: build an operating loop"),
        ((948, 370, 1178, 438), PALE_PURPLE, "Ask: approve Q4"),
        ((650, 462, 1070, 548), PAPER, "The agent must find the storyline—not decorate the list."),
    ]
    for box, fill, text in fragments:
        rr(d, box, 10, fill, LINE)
        wrapped(d, (box[0] + 18, box[1] + 18), text, 34, 16, NAVY, True, 4)
    return img


def stage_plan() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    d = ImageDraw.Draw(img)
    header(d, 2, "One deck specification aligns the whole story", "Conclusion-led titles + tested layouts + source mapping")
    rr(d, (54, 192, 400, 610), 16, NAVY)
    label(d, (82, 222), "deck-spec.json", 18, PAPER, True)
    code = [
        ('"decision"', '"Approve Q4 scale-up"'),
        ('"slide_1"', '"performance-dashboard"'),
        ('"slide_2"', '"diagnosis-tree"'),
        ('"slide_3"', '"roadmap"'),
        ('"slide_4"', '"capability-loop"'),
        ('"slide_5"', '"decision-page"'),
    ]
    y = 276
    for key, value in code:
        label(d, (82, y), key, 14, "#8EC7FF", True)
        label(d, (190, y), ":", 14, PAPER)
        label(d, (206, y), value, 14, "#FFD2B5")
        y += 44
    label(d, (82, 560), "✓ structure validated", 14, "#7CE0C7", True)

    label(d, (438, 210), "FULL DECK PLANNED BEFORE DRAWING", 14, ORANGE, True)
    xs = [438, 592, 746, 900, 1054]
    for i, x in enumerate(xs):
        mini_slide(d, (x, 246, x + 136, 396), i)
        label(d, (x + 68, 420), f"SLIDE {i + 1}", 11, MUTED, True, "mm")
    draw_y = 442
    rr(d, (438, draw_y, 1190, 554), 12, PALE_BLUE)
    for i, text in enumerate(("Action title", "Layout ID", "Evidence", "Source ref", "Conclusion")):
        xx = 458 + i * 144
        label(d, (xx, draw_y + 30), text, 13, NAVY, True)
        draw = ImageDraw.Draw(img)
        draw.line((xx, draw_y + 58, xx + 102, draw_y + 58), fill=BLUE, width=4)
    return img


def stage_batch() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    d = ImageDraw.Draw(img)
    header(d, 3, "Generate the complete deck as one batch", "Fixed coordinates replace repeated layout calculation")
    label(d, (54, 200), "ONE RENDER PASS", 14, ORANGE, True)
    boxes = [(54, 244, 270, 402), (292, 244, 508, 402), (530, 244, 746, 402), (768, 244, 984, 402), (1006, 244, 1222, 402)]
    for i, box in enumerate(boxes):
        mini_slide(d, box, i)
        label(d, ((box[0] + box[2]) // 2, 428), f"0{i + 1}", 12, MUTED, True, "mm")
    rr(d, (54, 476, 1222, 584), 14, SOFT)
    items = [("8", "tested layouts", BLUE), ("1", "shared storyline", GREEN), ("1", "render batch", PURPLE), ("0", "repeated planning", ORANGE)]
    for i, (value, text, color) in enumerate(items):
        x = 92 + i * 286
        label(d, (x, 512), value, 30, color, True)
        label(d, (x + 54, 518), text, 15, NAVY, True)
    return img


def stage_repair() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    d = ImageDraw.Draw(img)
    header(d, 4, "Lock passing slides; repair only the failure", "A visual issue no longer restarts the whole deck")
    boxes = [(54, 238, 270, 396), (292, 238, 508, 396), (530, 238, 746, 396), (768, 238, 984, 396), (1006, 238, 1222, 396)]
    for i, box in enumerate(boxes):
        mini_slide(d, box, i, selected=i == 2, locked=i != 2)
    label(d, (638, 424), "TEXT OVERFLOW", 13, ORANGE, True, "mm")
    d.line((638, 398, 638, 414), fill=ORANGE, width=3)
    rr(d, (390, 478, 890, 572), 14, PALE_ORANGE, ORANGE, 2)
    label(d, (420, 504), "Slide 03  /  evidence-2", 15, NAVY, True)
    label(d, (420, 538), "Compress text → rerender one element", 17, ORANGE, True)
    return img


def stage_result() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    d = ImageDraw.Draw(img)
    header(d, 5, "Decision-ready slides, with less production waste", "Controlled five-slide runtime benchmark")
    rr(d, (54, 200, 558, 600), 16, NAVY)
    label(d, (88, 244), "79.4%", 72, PAPER, True)
    label(d, (90, 334), "LESS WALL TIME", 17, "#A9C8E8", True)
    d.line((90, 382, 520, 382), fill="#36536F", width=2)
    label(d, (90, 424), "4.86×", 42, "#7CE0C7", True)
    label(d, (236, 440), "faster", 17, PAPER, True)
    label(d, (90, 510), "Pixel-identical output", 17, PAPER, True)
    label(d, (90, 546), "No overflow failures", 17, PAPER, True)

    label(d, (602, 214), "THE OUTPUT", 14, ORANGE, True)
    mini_slide(d, (602, 252, 894, 466), 1)
    mini_slide(d, (916, 252, 1208, 466), 2)
    rr(d, (602, 500, 1208, 584), 12, PALE_GREEN)
    label(d, (628, 528), "PLAN ONCE", 14, GREEN, True)
    label(d, (760, 528), "→", 20, ORANGE, True)
    label(d, (806, 528), "RENDER IN BATCH", 14, GREEN, True)
    label(d, (982, 528), "→", 20, ORANGE, True)
    label(d, (1028, 528), "REPAIR ONLY", 14, GREEN, True)
    label(d, (628, 558), "Spend less time formatting. Make decisions visible.", 14, NAVY, True)
    return img


def main() -> None:
    stages = [stage_input(), stage_plan(), stage_batch(), stage_repair(), stage_result()]
    # Five deliberate keyframes keep the GitHub asset sharp, readable, and lightweight.
    palette_frames = [
        stage.resize((960, 540), Image.Resampling.LANCZOS).quantize(
            colors=32,
            method=Image.Quantize.MEDIANCUT,
            dither=Image.Dither.NONE,
        )
        for stage in stages
    ]
    palette_frames[0].save(
        OUTPUT,
        save_all=True,
        append_images=palette_frames[1:],
        duration=[1400, 1400, 1400, 1400, 2600],
        loop=0,
        optimize=True,
        disposal=2,
    )
    stages[-1].save(POSTER, optimize=True)
    print(f"Created {OUTPUT} ({OUTPUT.stat().st_size / 1024 / 1024:.2f} MiB)")
    print(f"Created {POSTER}")


if __name__ == "__main__":
    main()
