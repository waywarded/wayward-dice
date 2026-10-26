import { useEffect, useState } from "react";
import * as ironPreviews from "./iron";
import { DiceType } from "../types/DiceType";
import { DieColors } from "../types/Die";
import { rainbowColors } from "../helpers/customColors";
import { useSettingsStore } from "../settings/store";

const ORDER: DiceType[] = ["D4", "D6", "D8", "D10", "D12", "D20", "D100"];
const cache = new Map<string, string>();
const SIZE = 96;

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The Iron preview recoloured: its greys become the base, shaded as Iron is, its black the ink */
async function tint(type: DiceType, colors: DieColors): Promise<string> {
  const key = `${type}|${colors.base}|${colors.ink}`;
  const hit = cache.get(key);
  if (hit) {
    return hit;
  }
  const image = new Image();
  image.src = ironPreviews[type];
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const context = canvas.getContext("2d")!;
  context.drawImage(image, 0, 0, SIZE, SIZE);
  const pixels = context.getImageData(0, 0, SIZE, SIZE);
  const base = hexToRgb(colors.base);
  const ink = hexToRgb(colors.ink);
  const data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    // Iron's numbers are near black; its shadowed facets (60–140) are shading, not numbers
    const inkAmount = Math.min(1, Math.max(0, (50 - lum) / 30));
    const shade = Math.min(1.1, 0.4 + (0.6 * lum) / 210);
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.min(255, base[c] * shade) * (1 - inkAmount) + ink[c] * inkAmount;
    }
  }
  context.putImageData(pixels, 0, 0);
  const url = canvas.toDataURL("image/png");
  cache.set(key, url);
  return url;
}

/** The colours a custom die of this type shows in previews: rainbow turns each type a different hue */
export function previewColors(type: DiceType, custom: { base: string; ink: string; rainbow: boolean }): DieColors {
  const base = custom.rainbow ? rainbowColors(custom.base, ORDER.length)[ORDER.indexOf(type)] : custom.base;
  return { base, ink: custom.ink };
}

/** A data URL for a custom die's preview in the player's colours (empty until drawn) */
export function useCustomPreview(type: DiceType, colors?: DieColors) {
  const custom = useSettingsStore((state) => state.customDice);
  const wanted = colors ?? previewColors(type, custom);
  const [url, setUrl] = useState(() => cache.get(`${type}|${wanted.base}|${wanted.ink}`) ?? "");
  useEffect(() => {
    let current = true;
    tint(type, wanted).then((next) => current && setUrl(next));
    return () => {
      current = false;
    };
  }, [type, wanted.base, wanted.ink]);
  return url;
}
