import { describe, expect, it } from "vitest";
import { getDiceToRoll } from "./store";
import { keepLabel, keepOptions, useSettingsStore } from "../settings/store";
import { Dice } from "../types/Dice";
import { Die } from "../types/Die";

const d20: Die = { id: "set_D20", type: "D20", style: "GALAXY" };
const d6: Die = { id: "set_D6", type: "D6", style: "GALAXY" };
const diceById = { [d20.id]: d20, [d6.id]: d6 };

describe("getDiceToRoll", () => {
  it("rolls each die once without a keep", () => {
    expect(getDiceToRoll({ set_D20: 1, set_D6: 2 }, null, diceById)).toHaveLength(3);
  });

  it("adds extra dice per die and keeps one", () => {
    const [group] = getDiceToRoll({ set_D20: 1 }, "DISADVANTAGE", diceById, 2) as Dice[];
    expect(group.combination).toBe("LOWEST");
    expect(group.dice).toHaveLength(3);
  });

  it("defaults to one extra die (Adv/Dis)", () => {
    const groups = getDiceToRoll({ set_D20: 2 }, "ADVANTAGE", diceById) as Dice[];
    expect(groups.map((g) => [g.combination, g.dice.length])).toEqual([
      ["HIGHEST", 2],
      ["HIGHEST", 2],
    ]);
  });
});

describe("player settings", () => {
  it("opens the dice panel for the player's own rolls unless they choose otherwise", () => {
    expect(useSettingsStore.getState().autoOpen).toBe("MINE");
    expect(useSettingsStore.getState().othersRolls).toBe("TRAY");
  });
});

describe("keep names", () => {
  it("calls keep-lowest a boon in roll-under rooms", () => {
    expect(keepLabel("DISADVANTAGE", 1, "BOON")).toBe("Boon");
    expect(keepLabel("ADVANTAGE", 2, "BOON")).toBe("Bane ×2");
    expect(keepLabel("ADVANTAGE", 1, "ADVANTAGE")).toBe("Adv");
    expect(keepLabel(null, 1, "BOON")).toBeNull();
  });

  it("puts the worse option first", () => {
    expect(keepOptions("BOON").map((o) => o.label)).toEqual(["Bane", "Boon"]);
    expect(keepOptions("ADVANTAGE").map((o) => o.label)).toEqual(["Dis", "Adv"]);
  });
});
