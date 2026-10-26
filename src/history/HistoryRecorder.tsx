import OBR from "@owlbear-rodeo/sdk";
import { useEffect } from "react";
import { useDiceRollStore } from "../dice/store";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { getRollNotation } from "../helpers/getRollNotation";
import { getRollSummary } from "../helpers/getRollSummary";
import { DiceRoll } from "../types/DiceRoll";
import { addEntry, historyKey, HistoryEntry, isHistoryEntry, saveLocalHidden } from "./history";

/**
 * Adds each roll thrown in this frame (panel or popover) to the shared log
 * once it comes to rest. A roll handed over already finished isn't recorded
 * again; a re-roll gets new dice ids, so it's a new entry.
 */
export function HistoryRecorder() {
  useEffect(() => recordFinishedRolls(), []);
  return null;
}

/** Subscribes to this frame's dice roll store; returns the unsubscribe */
export function recordFinishedRolls() {
  const thrown = new Set<string>();
    const recorded = new Set<string>();
  return useDiceRollStore.subscribe((state) => {
      const roll = state.roll;
      if (!roll) {
        return;
      }
      const dice = getDieFromDice(roll);
      if (dice.length === 0) {
        return;
      }
      const key = dice.map((die) => die.id).join();
      if (dice.some((die) => state.rollValues[die.id] === null || state.rollValues[die.id] === undefined)) {
        thrown.add(key);
        return;
      }
      if (!thrown.has(key) || recorded.has(key)) {
        return;
      }
      recorded.add(key);
      const values = state.rollValues as Record<string, number>;
      void record(roll, dice.map((die) => values[die.id]), getRollSummary(roll, values));
    });
}

async function record(roll: DiceRoll, faces: number[], summary: string | null) {
  const [id, name, color, metadata] = await Promise.all([
    OBR.player.getId(),
    OBR.player.getName(),
    OBR.player.getColor(),
    OBR.room.getMetadata(),
  ]);
  const entry: HistoryEntry = {
    // Short: room metadata space is shared with every extension
    i: `${id.slice(0, 4)}${Date.now().toString(36)}`,
    t: Math.round(Date.now() / 1000),
    p: name,
    c: color,
    ...(roll.request?.label || roll.pushed
      ? { l: [roll.request?.label, roll.pushed ? "pushed" : ""].filter(Boolean).join(" · ") }
      : {}),
    n: getRollNotation(roll),
    ...(summary !== null ? { r: summary } : {}),
    v: faces.join(","),
  };
  const shared: HistoryEntry = roll.hidden ? { i: entry.i, t: entry.t, p: name, c: color, h: 1 } : entry;
  if (roll.hidden) {
    saveLocalHidden({ ...entry, h: 1 });
  }
  const mine = metadata[historyKey(id)];
  const entries = Array.isArray(mine) ? mine.filter(isHistoryEntry) : [];
  await OBR.room.setMetadata({ [historyKey(id)]: addEntry(entries, shared) });
}
