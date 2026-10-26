import { describe, expect, it } from "vitest";
import { contrastRatio, paintCustomDice, rainbowColors } from "./customColors";
import { getRollFromNotation, parseNotation } from "../api/notation";
import { getDieFromDice } from "./getDieFromDice";

const custom = { base: "#2a6fdb", ink: "#ffffff", rainbow: false };
const roll = (notation: string) => getRollFromNotation(parseNotation(notation), "CUSTOM");

describe("custom dice colours", () => {
  it("paints every custom die in the player's colours", () => {
    const dice = getDieFromDice(paintCustomDice(roll("2d6+1"), custom));
    expect(dice.map((d) => d.colors)).toEqual([
      { base: "#2a6fdb", ink: "#ffffff" },
      { base: "#2a6fdb", ink: "#ffffff" },
    ]);
  });

  it("gives each die its own hue with rainbow, starting from the base", () => {
    const dice = getDieFromDice(paintCustomDice(roll("2d12"), { ...custom, rainbow: true }));
    expect(dice[0].colors?.base).toBe("#2a6fdb");
    expect(dice[1].colors?.base).not.toBe(dice[0].colors?.base);
    expect(dice.every((d) => d.colors?.ink === "#ffffff")).toBe(true);
  });

  it("keeps a d100's tens and units the same colour", () => {
    const dice = getDieFromDice(paintCustomDice(roll("d100+d6"), { ...custom, rainbow: true }));
    expect(dice).toHaveLength(3);
    expect(dice[0].colors).toEqual(dice[1].colors);
    expect(dice[2].colors).not.toEqual(dice[0].colors);
  });

  it("leaves other styles and already painted dice alone", () => {
    const galaxy = getRollFromNotation(parseNotation("2d6"), "GALAXY");
    expect(paintCustomDice(galaxy, custom)).toBe(galaxy);
    const painted = paintCustomDice(roll("d20"), custom);
    expect(getDieFromDice(paintCustomDice(painted, { ...custom, base: "#000000" }))[0].colors?.base).toBe("#2a6fdb");
  });

  it("spreads rainbow hues evenly, and colours a grey", () => {
    expect(rainbowColors("#ff0000", 3)).toEqual(["#ff0000", "#00ff00", "#0000ff"]);
    expect(new Set(rainbowColors("#808080", 2)).size).toBe(2);
  });

  it("measures contrast so unreadable numbers can be flagged", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contrastRatio("#2a6fdb", "#2a70dc")).toBeLessThan(1.1);
  });
});
