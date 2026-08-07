export const PX_PER_INCH = 96;

export const COLORS = {
  navy: "0B1F33",
  ink: "172331",
  gray: "5E6A75",
  faint: "87939F",
  rule: "CDD4DB",
  brightBlue: "2477FF",
  mutedBlue: "245A88",
  orange: "EB7625",
  green: "168A7A",
  purple: "6E4BD8",
  paleBlue: "EAF2FB",
  paleOrange: "FAEBDD",
  paleGreen: "E8F5F1",
  palePurple: "F0ECFB",
  softGray: "F4F6F8",
  white: "FFFFFF"
};

export const ACCENTS = {
  blue: { strong: COLORS.brightBlue, pale: COLORS.paleBlue },
  green: { strong: COLORS.green, pale: COLORS.paleGreen },
  purple: { strong: COLORS.purple, pale: COLORS.palePurple },
  orange: { strong: COLORS.orange, pale: COLORS.paleOrange },
  navy: { strong: COLORS.navy, pale: COLORS.softGray }
};

export const FONT_FACE = "Aptos";
export const FONT_FACE_CJK = "Microsoft YaHei";

export function px(value) {
  return value / PX_PER_INCH;
}

export function box(values) {
  const [x, y, w, h] = values;
  return { x: px(x), y: px(y), w: px(w), h: px(h) };
}

export function accent(name = "blue") {
  return ACCENTS[name] || ACCENTS.blue;
}
