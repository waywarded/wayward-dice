import { beforeEach, describe, expect, it, vi } from "vitest";

const room: Record<string, unknown> = {};
vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    player: {
      getId: async () => "player-1",
      getName: async () => "Hilda",
      getColor: async () => "#ff5c5c",
    },
    room: {
      getMetadata: async () => ({ ...room }),
      setMetadata: async (update: Record<string, unknown>) => Object.assign(room, update),
    },
  },
}));

import { recordFinishedRolls } from "./HistoryRecorder";
import { historyKey, HistoryEntry } from "./history";
import { useDiceRollStore } from "../dice/store";
import { getRollFromNotation, parseNotation } from "../api/notation";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const mine = () => (room[historyKey("player-1")] ?? []) as HistoryEntry[];

/** Throw a roll, then let each die land on the given face */
function throwAndLand(notation: string, faces: number[], extra: { hidden?: boolean; label?: string } = {}) {
  const store = useDiceRollStore.getState();
  store.startRoll({
    ...getRollFromNotation(parseNotation(notation), "GALAXY"),
    hidden: extra.hidden,
    ...(extra.label ? { request: { rollId: "r", source: "s", label: extra.label, notation } } : {}),
  });
  const ids = Object.keys(useDiceRollStore.getState().rollValues);
  ids.forEach((id, i) =>
    useDiceRollStore.getState().finishDieRoll(id, faces[i], { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } })
  );
}

describe("recordFinishedRolls", () => {
  beforeEach(() => {
    for (const key of Object.keys(room)) delete room[key];
    useDiceRollStore.getState().clearRoll();
  });

  it("adds a finished roll to the player's own key, once", async () => {
    const stop = recordFinishedRolls();
    throwAndLand("5d6=6", [6, 2, 6, 5, 1], { label: "Investigation · 5 dice" });
    await flush();
    expect(mine()).toHaveLength(1);
    expect(mine()[0]).toMatchObject({ p: "Hilda", c: "#ff5c5c", l: "Investigation · 5 dice", n: "5d6=6", r: "2 successes", v: "6,2,6,5,1" });
    // Further store updates for the same roll don't add it again
    useDiceRollStore.setState({});
    await flush();
    expect(mine()).toHaveLength(1);
    stop();
  });

  it("shares only who and when for a hidden roll", async () => {
    const stop = recordFinishedRolls();
    throwAndLand("d20", [14], { hidden: true, label: "GM: Ambush" });
    await flush();
    expect(mine()[0]).toMatchObject({ p: "Hilda", h: 1 });
    expect(mine()[0].r).toBeUndefined();
    expect(mine()[0].l).toBeUndefined();
    stop();
  });

  it("doesn't record a roll that arrived already finished (handed over from another frame)", async () => {
    const stop = recordFinishedRolls();
    useDiceRollStore.getState().loadFinishedRoll({
      roll: { dice: [{ id: "x1", style: "GALAXY", type: "D20" }] },
      rollValues: { x1: 7 },
      rollTransforms: {},
      rollThrows: {},
    });
    await flush();
    expect(mine()).toHaveLength(0);
    stop();
  });
});
