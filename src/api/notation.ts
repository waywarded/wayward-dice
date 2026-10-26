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

/**
 * Parse the subset the sheets send: `2d6+1d4+3`, `d20-1`, `2d20kh1`.
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
    const type = SIDES[match[2]];
    if (!type) {
      throw new Error(`No d${match[2]} in this dice set`);
    }
    if (count < 1 || count > 20) {
      throw new Error(`Between 1 and 20 dice per term ("${raw}")`);
    }
    const keep = match[3] === "kh1" ? "HIGHEST" : match[3] === "kl1" ? "LOWEST" : undefined;
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
    const rolled = Array.from({ length: group.count }, () => die(group.type, style));
    if (group.keep) {
      dice.push({ dice: rolled, combination: group.keep });
    } else {
      dice.push(...rolled);
    }
  }
  return dice;
}
