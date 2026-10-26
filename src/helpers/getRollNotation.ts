import { Dice, isDice } from "../types/Dice";
import { Die, isDie } from "../types/Die";

const SIDES: Record<string, string> = {
  D4: "d4",
  D6: "d6",
  D8: "d8",
  D10: "d10",
  D12: "d12",
  D20: "d20",
  D100: "d100",
};

/** A d100 is a tens die plus a d10 under the hood */
function isD100Pair(dice: Dice) {
  const [a, b] = dice.dice;
  return dice.dice.length === 2 && isDie(a) && isDie(b) && a.type === "D100" && b.type === "D10";
}

/** One die (or d100 pair) as "d6", "d100" */
function single(item: Die | Dice): string | null {
  if (isDie(item)) {
    return SIDES[item.type] ?? null;
  }
  return isD100Pair(item) ? "d100" : null;
}

/** Equal neighbours grouped: d6, d6, d8 → 2d6+d8 */
function sumTerms(items: (Die | Dice)[]): string[] {
  const terms: string[] = [];
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    const one = single(item);
    if (one) {
      let n = 1;
      while (i + n < items.length && single(items[i + n]) === one) {
        n++;
      }
      terms.push(n > 1 ? `${n}${one}` : one);
      i += n;
    } else if (isDice(item)) {
      terms.push(getRollNotation(item));
      i++;
    } else {
      i++;
    }
  }
  return terms;
}

function withBonus(terms: string, bonus = 0) {
  return bonus > 0 ? `${terms}+${bonus}` : bonus < 0 ? `${terms}${bonus}` : terms;
}

/** How a roll reads in notation, e.g. "3d20kl1", "5d6=6", "2d6+1", "1d6+2, 1d10, 1d10" */
export function getRollNotation(dice: Dice): string {
  switch (dice.combination) {
    case "PARTS":
      return dice.dice.map((part) => (isDice(part) ? getRollNotation(part) : single(part) ?? "")).join(", ");
    case "D66":
      return withBonus("d66", dice.bonus);
    case "HIGHEST":
    case "LOWEST": {
      const one = dice.dice.length > 0 ? single(dice.dice[0]) : null;
      if (one && dice.dice.every((item) => single(item) === one)) {
        return withBonus(`${dice.dice.length}${one}k${dice.combination === "HIGHEST" ? "h" : "l"}1`, dice.bonus);
      }
      return withBonus(sumTerms(dice.dice).join(dice.combination === "HIGHEST" ? " > " : " < "), dice.bonus);
    }
    case "COUNT":
      return `${sumTerms(dice.dice).join("+")}${dice.count ? `${dice.count.op}${dice.count.target}` : ""}`;
    default:
      if (isD100Pair(dice)) {
        return withBonus("d100", dice.bonus);
      }
      return withBonus(sumTerms(dice.dice).join("+"), dice.bonus);
  }
}
