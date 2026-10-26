import { describe, expect, it } from "vitest";
import { getDiceFromNotation, parseNotation } from "./notation";
import { getCombinedDiceValue } from "../helpers/getCombinedDiceValue";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { Dice } from "../types/Dice";

/** Roll the notation with fixed faces, in throw order */
function total(notation: string, faces: number[]) {
  const parsed = parseNotation(notation);
  const roll: Dice = { dice: getDiceFromNotation(parsed, "GALAXY"), bonus: parsed.bonus };
  const dice = getDieFromDice(roll);
  expect(dice).toHaveLength(faces.length);
  const values: Record<string, number> = {};
  dice.forEach((die, i) => (values[die.id] = faces[i]));
  return getCombinedDiceValue(roll, values);
}

describe("parseNotation", () => {
  it("reads dice, bonuses and keeps", () => {
    expect(parseNotation("2d6+1")).toEqual({ groups: [{ count: 2, type: "D6" }], bonus: 1 });
    expect(parseNotation("d20 - 2").bonus).toBe(-2);
    expect(parseNotation("3d20kl1").groups).toEqual([{ count: 3, type: "D20", keep: "LOWEST" }]);
    expect(parseNotation("2D20KH1+3").groups[0].keep).toBe("HIGHEST");
    expect(parseNotation("d66").groups).toEqual([{ count: 1, type: "D6", d66: true }]);
  });

  it("refuses what it can't roll", () => {
    expect(() => parseNotation("3d7")).toThrow("No d7 in this dice set");
    expect(() => parseNotation("1d20kh1")).toThrow("at least two");
    expect(() => parseNotation("2d66")).toThrow("single d66");
    expect(() => parseNotation("21d6")).toThrow("Between 1 and 20");
    expect(() => parseNotation("5")).toThrow("No dice");
    expect(() => parseNotation("d20-d4")).toThrow("Subtracting");
    expect(() => parseNotation("4d6=6")).toThrow("Can't read");
  });
});

describe("rolled totals", () => {
  it("sums dice and bonus", () => {
    expect(total("2d6+1", [3, 4])).toBe(8);
  });

  it("keeps the lowest of several (boons)", () => {
    expect(total("3d20kl1", [12, 5, 17])).toBe(5);
    expect(total("2d20kh1+3", [12, 5])).toBe(15);
  });

  it("reads d66 as tens and units", () => {
    expect(total("d66", [3, 5])).toBe(35);
    expect(total("d66", [6, 1])).toBe(61);
  });

  it("reads a d100 pair as the panel does", () => {
    expect(total("d100", [40, 7])).toBe(47);
    expect(total("d100", [0, 0])).toBe(100);
  });
});
