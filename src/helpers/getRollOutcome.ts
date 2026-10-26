import { CountRule, CritRule, Dice, isDice, meetsCount, meetsCrit } from "../types/Dice";
import { isDie } from "../types/Die";
import { getCombinedDiceValue } from "./getCombinedDiceValue";
import { getDieFromDice } from "./getDieFromDice";

export interface RollOutcome {
  /** As people read it: "17", "2 successes", "8 · Success", "6 · 3 · 9" */
  summary: string;
  /** Kept dice plus bonus, or the number of successes; null for parts */
  total: number | null;
  successes?: number;
  /** Only for a single die against a target */
  success?: boolean;
  crit?: "critical" | "fumble";
}

type Roll = Dice & { crit?: CritRule };

/** One die (or keep, or d100 pair) counted against a target: `d20<=12`, `2d20kl1<=12` */
export function isTargetRoll(dice: Dice) {
  return dice.combination === "COUNT" && dice.dice.length === 1;
}

/** The natural face of a roll that comes down to one die (no bonus, no count), else null */
export function getKeptFace(dice: Dice, values: Record<string, number>): number | null {
  if (dice.dice.length !== 1 || dice.combination === "PARTS" || dice.combination === "D66") {
    return null;
  }
  const [item] = dice.dice;
  if (isDie(item)) {
    const value = values[item.id];
    return value === undefined ? null : value === 0 && item.type === "D10" ? 10 : value;
  }
  return isDice(item) ? getCombinedDiceValue({ ...item, bonus: 0 }, values) : null;
}

/** Everything a tray, the log and the answer to a sheet say about a finished roll */
export function getRollOutcome(dice: Roll, values: Record<string, number>): RollOutcome | null {
  if (dice.combination === "PARTS") {
    const parts = dice.dice.map((part) => (isDice(part) ? getRollOutcome(part, values) : null));
    if (parts.some((part) => part === null)) {
      return null;
    }
    return { summary: parts.map((part) => part!.summary).join(" · "), total: null };
  }
  const total = getCombinedDiceValue(dice, values);
  if (total === null) {
    return null;
  }
  const face = getKeptFace(dice, values);
  const crit =
    face === null || !dice.crit
      ? undefined
      : meetsCrit(face, dice.crit.success)
        ? ("critical" as const)
        : meetsCrit(face, dice.crit.failure)
          ? ("fumble" as const)
          : undefined;
  if (isTargetRoll(dice) && face !== null) {
    // A critical face decides the roll, as Dragonbane's Dragon and Demon do
    const success = crit ? crit === "critical" : total === 1;
    const word = crit === "critical" ? "Critical success" : crit === "fumble" ? "Critical failure" : success ? "Success" : "Failure";
    return { summary: `${face} · ${word}`, total, successes: total, success, ...(crit ? { crit } : {}) };
  }
  if (dice.combination === "COUNT") {
    return { summary: total === 1 ? "1 success" : `${total} successes`, total, successes: total };
  }
  const word = crit === "critical" ? " · Critical" : crit === "fumble" ? " · Fumble" : "";
  return { summary: `${total}${word}`, total, ...(crit ? { crit } : {}) };
}

/**
 * Critical faces for a roll that comes down to one d20, when the sheet sent none:
 * roll-under (a `<`/`<=` target, or a Boon/Bane room) makes 1 the crit and 20
 * the fumble; roll-over the reverse.
 */
export function defaultCrit(dice: Dice, rollUnder: boolean): CritRule | undefined {
  if (dice.dice.length !== 1 || dice.combination === "PARTS" || dice.combination === "D66") {
    return undefined;
  }
  const dieTypes = getDieFromDice({ dice: dice.dice }).map((die) => die.type);
  if (dieTypes.length === 0 || dieTypes.some((type) => type !== "D20")) {
    return undefined;
  }
  const under = dice.count ? countIsUnder(dice.count) ?? rollUnder : rollUnder;
  return under ? { success: "1", failure: "20" } : { success: "20", failure: "1" };
}

function countIsUnder({ op }: CountRule) {
  return op === "<" || op === "<=" ? true : op === ">" || op === ">=" ? false : undefined;
}

/**
 * The dice a push rolls again, or null when there's nothing to push: a pool's
 * dice that didn't succeed, or the whole roll when a target roll failed.
 * Once per roll; plain totals can't be pushed.
 */
export function getPushDice(dice: Roll & { pushed?: boolean }, values: Record<string, number>): string[] | null {
  if (dice.pushed || dice.combination !== "COUNT" || !dice.count) {
    return null;
  }
  const outcome = getRollOutcome(dice, values);
  if (!outcome) {
    return null;
  }
  if (isTargetRoll(dice)) {
    return outcome.success ? null : getDieFromDice(dice).map((die) => die.id);
  }
  const rule = dice.count;
  const failed = dice.dice.flatMap((item) => {
    const value = isDie(item)
      ? values[item.id] === 0 && item.type === "D10"
        ? 10
        : values[item.id]
      : getCombinedDiceValue(item, values);
    if (value === null || value === undefined || meetsCount(value, rule)) {
      return [];
    }
    return isDie(item) ? [item.id] : getDieFromDice(item).map((die) => die.id);
  });
  return failed.length > 0 ? failed : null;
}
