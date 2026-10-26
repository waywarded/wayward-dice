import { Dice } from "../types/Dice";
import { DiceType } from "../types/DiceType";
import { Die } from "../types/Die";
import { DiceStyle } from "../types/DiceStyle";
import { generateDiceId } from "../helpers/generateDiceId";

export interface DiceGroup {
  count: number;
  type: DiceType;
  /** Keep only the highest or lowest one (`kh1` / `kl1`) */
  keep?: "HIGHEST" | "LOWEST";
  /** `d66`: two d6 read as tens and units */
  d66?: boolean;
}

export interface ParsedNotation {
  groups: DiceGroup[];
  bonus: number;
}

const SIDES: Record<string, DiceType> = {
  "4": "D4",
  "6": "D6",
  "8": "D8",
  "10": "D10",
  "12": "D12",
  "20": "D20",
  "100": "D100",
};

const TERM = /^(\d*)d(\d+)(k[hl]1)?$/;
const MAX_DICE = 20;

/**
 * Parse the subset the sheets send: `2d6+1d4+3`, `d20-1`, `2d20kh1`, `3d20kl1`, `d66`.
 * Throws with a readable message for anything else.
 */
export function parseNotation(notation: string): ParsedNotation {
  const source = notation.replace(/\s+/g, "").toLowerCase();
  if (!source) {
    throw new Error("Empty notation");
  }
  const terms = source.match(/[+-]?[^+-]+/g) ?? [];
  if (terms.join("") !== source) {
    throw new Error(`Can't read "${notation}"`);
  }
  const groups: DiceGroup[] = [];
  let bonus = 0;
  for (const raw of terms) {
    const negative = raw.startsWith("-");
    const term = raw.replace(/^[+-]/, "");
    if (/^\d+$/.test(term)) {
      bonus += (negative ? -1 : 1) * Number(term);
      continue;
    }
    const match = TERM.exec(term);
    if (!match) {
      throw new Error(`Can't read "${raw}" in "${notation}"`);
    }
    if (negative) {
      throw new Error(`Subtracting dice isn't supported ("${raw}")`);
    }
    const count = match[1] === "" ? 1 : Number(match[1]);
    const keep = match[3] === "kh1" ? "HIGHEST" : match[3] === "kl1" ? "LOWEST" : undefined;
    if (match[2] === "66") {
      if (count !== 1 || keep) {
        throw new Error(`Only a single d66 per term ("${raw}")`);
      }
      groups.push({ count: 1, type: "D6", d66: true });
      continue;
    }
    const type = SIDES[match[2]];
    if (!type) {
      throw new Error(`No d${match[2]} in this dice set`);
    }
    if (count < 1 || count > MAX_DICE) {
      throw new Error(`Between 1 and ${MAX_DICE} dice per term ("${raw}")`);
    }
    if (keep && count < 2) {
      throw new Error(`Keeping one die needs at least two ("${raw}")`);
    }
    groups.push({ count, type, keep });
  }
  if (groups.length === 0) {
    throw new Error(`No dice in "${notation}"`);
  }
  return { groups, bonus };
}

function die(type: DiceType, style: DiceStyle): Die | Dice {
  // A d100 is a tens die plus a d10, as the dice picker rolls it
  if (type === "D100") {
    return {
      dice: [
        { id: generateDiceId(), style, type: "D100" },
        { id: generateDiceId(), style, type: "D10" },
      ],
    };
  }
  return { id: generateDiceId(), style, type };
}

/** The dice to throw for a parsed notation, in one style */
export function getDiceFromNotation(parsed: ParsedNotation, style: DiceStyle): (Die | Dice)[] {
  const dice: (Die | Dice)[] = [];
  for (const group of parsed.groups) {
    if (group.d66) {
      dice.push({ dice: [die("D6", style), die("D6", style)], combination: "D66" });
      continue;
    }
    const rolled = Array.from({ length: group.count }, () => die(group.type, style));
    if (group.keep) {
      dice.push({ dice: rolled, combination: group.keep });
    } else {
      dice.push(...rolled);
    }
  }
  return dice;
}
