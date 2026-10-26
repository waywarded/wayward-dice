import { CountRule, Dice } from "../types/Dice";
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

/** One comma-separated part: dice and a bonus, or dice counted against a rule */
export interface ParsedPart {
  groups: DiceGroup[];
  bonus: number;
  count?: CountRule;
}

export interface ParsedNotation {
  parts: ParsedPart[];
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
const COUNT = /^(.*?)(>=|<=|=|>|<)(\d+)$/;
const MAX_DICE = 20;
const MAX_PARTS = 5;

/**
 * Parse what the sheets send: `2d6+1d4+3`, `d20-1`, `2d20kh1`, `3d20kl1`, `d66`,
 * success counting (`5d6=6`, `2d10<6`) and comma parts (`1d6+2, 1d10, 1d10`).
 * Throws with a readable message for anything else.
 */
export function parseNotation(notation: string): ParsedNotation {
  const source = notation.replace(/\s+/g, "").toLowerCase();
  if (!source) {
    throw new Error("Empty notation");
  }
  const parts = source.split(",");
  if (parts.length > MAX_PARTS) {
    throw new Error(`At most ${MAX_PARTS} parts ("${notation}")`);
  }
  const parsed = parts.map((part) => parsePart(part, notation));
  const dice = parsed.reduce((sum, part) => sum + part.groups.reduce((n, g) => n + g.count, 0), 0);
  if (dice > MAX_DICE) {
    throw new Error(`At most ${MAX_DICE} dice ("${notation}")`);
  }
  return { parts: parsed };
}

function parsePart(part: string, notation: string): ParsedPart {
  if (!part) {
    throw new Error(`Can't read "${notation}"`);
  }
  let count: CountRule | undefined;
  const counted = COUNT.exec(part);
  if (counted) {
    part = counted[1];
    count = { op: counted[2] as CountRule["op"], target: Number(counted[3]) };
  }
  const terms = part.match(/[+-]?[^+-]+/g) ?? [];
  if (terms.join("") !== part) {
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
    const n = match[1] === "" ? 1 : Number(match[1]);
    const keep = match[3] === "kh1" ? "HIGHEST" : match[3] === "kl1" ? "LOWEST" : undefined;
    if (match[2] === "66") {
      if (n !== 1 || keep) {
        throw new Error(`Only a single d66 per term ("${raw}")`);
      }
      groups.push({ count: 1, type: "D6", d66: true });
      continue;
    }
    const type = SIDES[match[2]];
    if (!type) {
      throw new Error(`No d${match[2]} in this dice set`);
    }
    if (n < 1 || n > MAX_DICE) {
      throw new Error(`Between 1 and ${MAX_DICE} dice per term ("${raw}")`);
    }
    if (keep && n < 2) {
      throw new Error(`Keeping one die needs at least two ("${raw}")`);
    }
    groups.push({ count: n, type, keep });
  }
  if (groups.length === 0) {
    throw new Error(`No dice in "${notation}"`);
  }
  if (count && (bonus !== 0 || groups.some((g) => g.keep || g.d66))) {
    throw new Error(`Counting successes takes plain dice only ("${notation}")`);
  }
  return { groups, bonus, ...(count ? { count } : {}) };
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

/** The dice of one part, in one style */
function getPartDice(part: ParsedPart, style: DiceStyle): (Die | Dice)[] {
  const dice: (Die | Dice)[] = [];
  for (const group of part.groups) {
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

function getPartRoll(part: ParsedPart, style: DiceStyle): Dice {
  return part.count
    ? { dice: getPartDice(part, style), combination: "COUNT", count: part.count }
    : { dice: getPartDice(part, style), bonus: part.bonus };
}

/** The roll for a parsed notation, in one style: a comma notation keeps its parts apart */
export function getRollFromNotation(parsed: ParsedNotation, style: DiceStyle): Dice {
  if (parsed.parts.length === 1) {
    return getPartRoll(parsed.parts[0], style);
  }
  return { dice: parsed.parts.map((part) => getPartRoll(part, style)), combination: "PARTS" };
}
