import { beforeEach, describe, expect, it, vi } from "vitest";

// The OBR SDK needs a browser; staging only uses it to cancel an earlier request
vi.mock("./protocol", () => ({ sendRollError: vi.fn() }));
import { parseNotation } from "./notation";
import { stageRequest } from "./rollFromRequest";
import { useDiceControlsStore } from "../controls/store";
import { useDiceRollStore } from "../dice/store";

const request = (notation: string, visibility: "all" | "gm" = "all") => ({
  rollId: notation,
  source: "test",
  notation,
  label: "Hilda",
  visibility,
  mode: "stage" as const,
});
const stage = (notation: string, visibility?: "all" | "gm") => stageRequest(request(notation, visibility), parseNotation(notation));

describe("stageRequest", () => {
  beforeEach(() => {
    useDiceControlsStore.setState({ stagedRequest: null, diceHidden: false });
    useDiceRollStore.getState().clearRoll();
  });

  it("fills in a pool with its count rule, from an empty tray", () => {
    useDiceRollStore.setState({ roll: { dice: [] }, rollValues: { a: 3 } });
    expect(stage("5d6=6")).toBeNull();
    const controls = useDiceControlsStore.getState();
    const d6 = controls.diceSet.dice.find((d) => d.type === "D6")!;
    expect(controls.diceCounts[d6.id]).toBe(5);
    expect(controls.diceCount).toEqual({ op: "=", target: 6 });
    expect(controls.diceBonus).toBe(0);
    expect(useDiceRollStore.getState().roll).toBeNull();
  });

  it("fills in boons as a keep count, and a GM roll as hidden", () => {
    expect(stage("3d20kl1", "gm")).toBeNull();
    const controls = useDiceControlsStore.getState();
    expect([controls.diceAdvantage, controls.diceAdvantageCount, controls.diceCount]).toEqual(["DISADVANTAGE", 2, null]);
    expect(controls.diceHidden).toBe(true);
    expect(controls.stagedRequest?.hiddenBefore).toBe(false);
  });

  it("refuses what the panel can't show", () => {
    expect(stage("1d6+2, 1d10, 1d10")).toMatch(/several parts/);
    expect(stage("d66")).toMatch(/d66/);
    expect(stage("2d20kh1+1d6")).toMatch(/one kind of die/);
  });
});
