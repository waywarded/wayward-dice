import { describe, expect, it } from "vitest";
import { addEntry, clearedHistory, ENTRIES_PER_PLAYER, historyKey, HistoryEntry, mergeHistory } from "./history";
import { getRollNotation } from "../helpers/getRollNotation";
import { getRollFromNotation, parseNotation } from "../api/notation";

const entry = (i: string, t: number, extra: Partial<HistoryEntry> = {}): HistoryEntry => ({ i, t, p: "Hilda", ...extra });

describe("roll history", () => {
  it("keeps a player's newest few", () => {
    let entries: HistoryEntry[] = [];
    for (let t = 1; t <= ENTRIES_PER_PLAYER + 3; t++) {
      entries = addEntry(entries, entry(`r${t}`, t));
    }
    expect(entries).toHaveLength(ENTRIES_PER_PLAYER);
    expect(entries[0].i).toBe(`r${ENTRIES_PER_PLAYER + 3}`);
  });

  it("merges everyone's keys newest first, ignoring other extensions' metadata", () => {
    const merged = mergeHistory({
      [historyKey("a")]: [entry("a2", 30), entry("a1", 10)],
      [historyKey("b")]: [entry("b1", 20), { junk: true }],
      "other.extension/thing": [entry("x", 99)],
    });
    expect(merged.map((e) => e.i)).toEqual(["a2", "b1", "a1"]);
  });

  it("shows the roller's own hidden roll in full, others only as hidden", () => {
    const placeholder = entry("h1", 5, { h: 1 });
    const full = entry("h1", 5, { h: 1, l: "GM: Ambush", r: "14" });
    expect(mergeHistory({ [historyKey("gm")]: [placeholder] }, [full])[0].r).toBe("14");
    expect(mergeHistory({ [historyKey("gm")]: [placeholder] })[0].r).toBeUndefined();
  });

  it("clears every player's key", () => {
    expect(clearedHistory({ [historyKey("a")]: [], [historyKey("b")]: [], other: 1 })).toEqual({
      [historyKey("a")]: undefined,
      [historyKey("b")]: undefined,
    });
  });
});

describe("getRollNotation", () => {
  it.each(["2d6+1", "3d20kl1", "2d20kh1+3", "5d6=6", "2d10<6", "d66", "d100", "1d6+2, d10, d10", "d20-2", "2d6+d8"])(
    "reads back %s",
    (notation) => {
      const roll = getRollFromNotation(parseNotation(notation), "GALAXY");
      expect(getRollNotation(roll).replace(/^1d/, "d").replace(/, 1d/g, ", d")).toBe(notation.replace(/^1d/, "d"));
    }
  );
});
