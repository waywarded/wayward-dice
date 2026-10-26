import { describe, expect, it } from "vitest";
import { getRollFromNotation, parseNotation } from "./notation";
import { getCombinedDiceValue } from "../helpers/getCombinedDiceValue";
import { getRollSummary } from "../helpers/getRollSummary";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { Dice } from "../types/Dice";

/** Roll the notation with fixed faces, in throw order */
function rolled(notation: string, faces: number[]) {
  const roll: Dice = getRollFromNotation(parseNotation(notation), "GALAXY");
  const dice = getDieFromDice(roll);
  expect(dice).toHaveLength(faces.length);
  const values: Record<string, number> = {};
  dice.forEach((die, i) => (values[die.id] = faces[i]));
  return { roll, values };
}
const total = (notation: string, faces: number[]) => {
  const { roll, values } = rolled(notation, faces);
  return getCombinedDiceValue(roll, values);
};
const summary = (notation: string, faces: number[]) => {
  const { roll, values } = rolled(notation, faces);
  return getRollSummary(roll, values);
};

describe("parseNotation", () => {
  it("reads dice, bonuses and keeps", () => {
    expect(parseNotation("2d6+1")).toEqual({ parts: [{ groups: [{ count: 2, type: "D6" }], bonus: 1 }] });
    expect(parseNotation("d20 - 2").parts[0].bonus).toBe(-2);
    expect(parseNotation("3d20kl1").parts[0].groups).toEqual([{ count: 3, type: "D20", keep: "LOWEST" }]);
    expect(parseNotation("2D20KH1+3").parts[0].groups[0].keep).toBe("HIGHEST");
    expect(parseNotation("d66").parts[0].groups).toEqual([{ count: 1, type: "D6", d66: true }]);
  });

  it("reads success counting and comma parts", () => {
    expect(parseNotation("5d6=6").parts[0].count).toEqual({ op: "=", target: 6 });
    expect(parseNotation("2d10<6").parts[0].count).toEqual({ op: "<", target: 6 });
    expect(parseNotation("4d6>=5").parts[0].count).toEqual({ op: ">=", target: 5 });
    expect(parseNotation("1d6+2, 1d10, 1d10").parts.map((p) => p.bonus)).toEqual([2, 0, 0]);
  });

  it("refuses what it can't roll", () => {
    expect(() => parseNotation("3d7")).toThrow("No d7 in this dice set");
    expect(() => parseNotation("1d20kh1")).toThrow("at least two");
    expect(() => parseNotation("2d66")).toThrow("single d66");
    expect(() => parseNotation("21d6")).toThrow("Between 1 and 20");
    expect(() => parseNotation("5")).toThrow("No dice");
    expect(() => parseNotation("d20-d4")).toThrow("Subtracting");
    expect(() => parseNotation("4d6+1=6")).toThrow("plain dice only");
    expect(() => parseNotation("2d20kh1=6")).toThrow("plain dice only");
    expect(() => parseNotation("d6,")).toThrow("Can't read");
    expect(() => parseNotation("12d6, 12d6")).toThrow("At most 20 dice");
    expect(() => parseNotation("4d6==6")).toThrow("Can't read");
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

  it("counts successes", () => {
    expect(total("5d6=6", [6, 2, 6, 5, 1])).toBe(2);
    expect(summary("5d6=6", [6, 2, 6, 5, 1])).toBe("2 successes");
    expect(summary("3d6=6", [6, 2, 3])).toBe("1 success");
    // Starforged progress: challenge dice below the score
    expect(summary("2d10<6", [5, 6])).toBe("1 success");
    // A d10 shows 0 for ten
    expect(summary("2d10<6", [0, 3])).toBe("1 success");
  });

  it("keeps comma parts apart", () => {
    expect(total("1d6+2, 1d10, 1d10", [4, 3, 9])).toBeNull();
    expect(summary("1d6+2, 1d10, 1d10", [4, 3, 9])).toBe("6 · 3 · 9");
  });
});
