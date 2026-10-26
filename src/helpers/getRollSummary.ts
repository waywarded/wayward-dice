import { CritRule, Dice } from "../types/Dice";
import { getRollOutcome } from "./getRollOutcome";

/**
 * A roll's result as people read it: "17", "2 successes", "8 · Success", or each
 * part of a comma roll ("8 · 3 · 9"). Null until every die has a value.
 */
export function getRollSummary(dice: Dice & { crit?: CritRule }, values: Record<string, number>): string | null {
  return getRollOutcome(dice, values)?.summary ?? null;
}
