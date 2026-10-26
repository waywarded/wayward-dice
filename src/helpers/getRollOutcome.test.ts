import { beforeEach, describe, expect, it } from "vitest";
import { defaultCrit, getPushDice, getRollOutcome } from "./getRollOutcome";
import { getRollFromNotation, parseNotation } from "../api/notation";
import { getDieFromDice } from "./getDieFromDice";
import { CritRule, Dice } from "../types/Dice";
import { useDiceRollStore } from "../dice/store";
import { useSettingsStore } from "../settings/store";

/** A roll from notation with faces in throw order, and the crit rule it would get */
function rolled(notation: string, faces: number[], crit?: CritRule | "default", rollUnder = false) {
  const dice: Dice & { crit?: CritRule } = getRollFromNotation(parseNotation(notation), "GALAXY");
  if (crit === "default") {
    dice.crit = defaultCrit(dice, rollUnder);
  } else if (crit) {
    dice.crit = crit;
  }
  const values: Record<string, number> = {};
  getDieFromDice(dice).forEach((die, i) => (values[die.id] = faces[i]));
  return { dice, values };
}
const outcome = (...args: Parameters<typeof rolled>) => {
  const { dice, values } = rolled(...args);
  return getRollOutcome(dice, values);
};
const DRAGONBANE = { success: "1", failure: "20" };

describe("rolls against a target", () => {
  it("say Success or Failure with the kept face", () => {
    expect(outcome("d20<=12", [8])).toMatchObject({ summary: "8 · Success", success: true, total: 1 });
    expect(outcome("d20<=12", [15])).toMatchObject({ summary: "15 · Failure", success: false, total: 0 });
    // A bane keeps the highest
    expect(outcome("2d20kh1<=12", [8, 15])?.summary).toBe("15 · Failure");
    expect(outcome("3d20kl1<=12", [18, 9, 14])?.summary).toBe("9 · Success");
  });

  it("let a crit decide, as Dragonbane's Dragon and Demon do", () => {
    expect(outcome("d20<=12", [1], DRAGONBANE)).toMatchObject({ summary: "1 · Critical success", success: true, crit: "critical" });
    expect(outcome("d20<=12", [20], DRAGONBANE)).toMatchObject({ summary: "20 · Critical failure", success: false, crit: "fumble" });
  });
});

describe("crits", () => {
  it("default by direction: a roll-under target makes 20 the fumble", () => {
    expect(outcome("d20<=12", [20], "default")?.crit).toBe("fumble");
    expect(outcome("d20<=12", [1], "default")?.crit).toBe("critical");
  });

  it("default by the room for a plain d20: Boon/Bane rooms roll under", () => {
    expect(outcome("d20+3", [20], "default", false)).toMatchObject({ summary: "23 · Critical", crit: "critical" });
    expect(outcome("d20+3", [20], "default", true)).toMatchObject({ summary: "23 · Fumble", crit: "fumble" });
    expect(outcome("2d20kl1", [1, 9], "default", true)?.crit).toBe("critical");
  });

  it("only for a single d20 unless the sheet names crit faces", () => {
    expect(defaultCrit(rolled("2d6", [6, 6]).dice, false)).toBeUndefined();
    expect(defaultCrit(rolled("d12", [12]).dice, false)).toBeUndefined();
    expect(outcome("d12", [12], { success: ">11" })?.crit).toBe("critical");
    expect(outcome("d20", [17], { success: ">18" })?.crit).toBeUndefined();
    expect(outcome("d20", [18], { success: ">18" })?.crit).toBe("critical");
    expect(outcome("d20", [3], { failure: "<3" })?.crit).toBe("fumble");
  });
});

describe("pushes", () => {
  it("roll a pool's misses again", () => {
    const { dice, values } = rolled("5d6=6", [6, 2, 6, 5, 1]);
    const ids = getDieFromDice(dice).map((d) => d.id);
    expect(getPushDice(dice, values)).toEqual([ids[1], ids[3], ids[4]]);
  });

  it("roll a failed target roll again, whole; not a success, a plain total, or twice", () => {
    const failed = rolled("2d20kh1<=12", [8, 15]);
    expect(getPushDice(failed.dice, failed.values)).toHaveLength(2);
    const passed = rolled("d20<=12", [3]);
    expect(getPushDice(passed.dice, passed.values)).toBeNull();
    const sum = rolled("2d6", [1, 1]);
    expect(getPushDice(sum.dice, sum.values)).toBeNull();
    expect(getPushDice({ ...failed.dice, pushed: true }, failed.values)).toBeNull();
    const allSixes = rolled("2d6=6", [6, 6]);
    expect(getPushDice(allSixes.dice, allSixes.values)).toBeNull();
  });

  it("the store rolls only those dice again and marks the roll pushed", () => {
    const store = useDiceRollStore.getState();
    store.startRoll(getRollFromNotation(parseNotation("3d6=6"), "GALAXY"));
    const [a, b, c] = Object.keys(useDiceRollStore.getState().rollValues);
    const at = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } };
    store.finishDieRoll(a, 6, at);
    store.finishDieRoll(b, 2, at);
    store.finishDieRoll(c, 3, at);
    useDiceRollStore.getState().push([b, c]);
    const state = useDiceRollStore.getState();
    expect(state.roll?.pushed).toBe(true);
    expect(state.rollValues[a]).toBe(6);
    expect(Object.values(state.rollValues).filter((v) => v === null)).toHaveLength(2);
  });
});

describe("crit faces fixed when a roll starts", () => {
  beforeEach(() => useDiceRollStore.getState().clearRoll());

  it("from the request, else the room's direction", () => {
    useSettingsStore.setState({ room: { keepNames: "BOON", pushes: false } });
    useDiceRollStore.getState().startRoll(getRollFromNotation(parseNotation("d20"), "GALAXY"));
    expect(useDiceRollStore.getState().roll?.crit).toEqual({ success: "1", failure: "20" });
    useDiceRollStore.getState().startRoll({
      ...getRollFromNotation(parseNotation("d20"), "GALAXY"),
      request: { rollId: "r", source: "s", notation: "d20", crit: { success: ">18" } },
    });
    expect(useDiceRollStore.getState().roll?.crit).toEqual({ success: ">18" });
  });
});
