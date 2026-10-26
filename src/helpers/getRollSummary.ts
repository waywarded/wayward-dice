import { Dice, isDice } from "../types/Dice";
import { getCombinedDiceValue } from "./getCombinedDiceValue";

/**
 * A roll's result as people read it: "17", "2 successes", or each part of a
 * comma roll ("8 · 3 · 9"). Null until every die has a value.
 */
export function getRollSummary(dice: Dice, values: Record<string, number>): string | null {
  if (dice.combination === "PARTS") {
    const parts = dice.dice.map((part) => (isDice(part) ? getRollSummary(part, values) : null));
    return parts.some((part) => part === null) ? null : parts.join(" · ");
  }
  const value = getCombinedDiceValue(dice, values);
  if (value === null) {
    return null;
  }
  if (dice.combination === "COUNT") {
    return value === 1 ? "1 success" : `${value} successes`;
  }
  return `${value}`;
}
