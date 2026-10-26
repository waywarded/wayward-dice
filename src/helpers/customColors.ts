import { Dice, isDice } from "../types/Dice";
import { Die, DieColors, isDie } from "../types/Die";

/** The player's custom dice: body and number colours, and whether each die gets its own hue */
export interface CustomDice extends DieColors {
  rainbow: boolean;
}

export const DEFAULT_CUSTOM_DICE: CustomDice = { base: "#2a6fdb", ink: "#ffffff", rainbow: false };

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) {
    return [0, 0, l];
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

/**
 * `count` colours spread evenly round the hue wheel from `base`, keeping its
 * lightness. A grey has no hue to turn, so it gets a little colour first.
 */
export function rainbowColors(base: string, count: number): string[] {
  const [h, s, l] = hexToHsl(base);
  const saturation = Math.max(s, 0.6);
  return Array.from({ length: count }, (_, i) =>
    i === 0 && s >= 0.6 ? base.toLowerCase() : hslToHex((h + (360 * i) / count) % 360, saturation, l)
  );
}

/** WCAG contrast ratio, 1 (none) to 21 (black on white) */
export function contrastRatio(a: string, b: string) {
  const luminance = (hex: string) => {
    const [r, g, bl] = hexToRgb(hex).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/**
 * Gives a roll's custom dice their colours: all the same, or with `rainbow`
 * each die (a d100's tens and units as one) a hue of its own. Dice that already
 * carry colours keep them, so a re-roll doesn't repaint.
 */
export function paintCustomDice<T extends Dice>(roll: T, custom: CustomDice): T {
  const items: (Die | Dice)[] = [];
  const collect = (dice: Dice) => {
    for (const item of dice.dice) {
      // A d100 is a tens die and a units die: one colour for the pair
      const pair = isDice(item) && item.dice.length === 2 && isDie(item.dice[0]) && item.dice[0].type === "D100";
      if ((isDie(item) && item.style === "CUSTOM" && !item.colors) || (pair && (item.dice[0] as Die).style === "CUSTOM")) {
        items.push(item);
      } else if (isDice(item)) {
        collect(item);
      }
    }
  };
  collect(roll);
  if (items.length === 0) {
    return roll;
  }
  const hues = custom.rainbow ? rainbowColors(custom.base, items.length) : items.map(() => custom.base);
  const colourOf = new Map(items.map((item, i) => [item, { base: hues[i], ink: custom.ink }]));
  const paint = (dice: Dice): Dice => ({
    ...dice,
    dice: dice.dice.map((item) => {
      const colors = colourOf.get(item);
      if (colors && isDie(item)) {
        return { ...item, colors };
      }
      if (colors && isDice(item)) {
        return { ...item, dice: item.dice.map((die) => (isDie(die) ? { ...die, colors } : die)) };
      }
      return isDice(item) ? paint(item) : item;
    }),
  });
  return paint(roll) as T;
}
