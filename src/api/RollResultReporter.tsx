import { useEffect } from "react";
import { useDiceRollStore } from "../dice/store";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { getCombinedDiceValue } from "../helpers/getCombinedDiceValue";
import { sendRollResult } from "./protocol";
import { Dice, isDice } from "../types/Dice";

/** A total, and the successes when the dice were counted */
function partResult(dice: Dice, values: Record<string, number>) {
  const total = getCombinedDiceValue(dice, values);
  return dice.combination === "COUNT" ? { total, successes: total ?? 0 } : { total };
}

/**
 * Sends `{source}/roll-result` when a requested roll in this frame's dice store
 * comes to rest. Mounted wherever rolls are thrown (the panel and the popover).
 * Only rolls thrown in this frame count: one handed over already finished was
 * reported by the frame that threw it.
 */
export function RollResultReporter() {
  useEffect(() => {
    const thrown = new Set<string>();
    const reported = new Set<string>();
    return useDiceRollStore.subscribe((state) => {
      const roll = state.roll;
      const request = roll?.request;
      if (!roll || !request || reported.has(request.rollId)) {
        return;
      }
      const dice = getDieFromDice(roll);
      const values = dice.map((die) => state.rollValues[die.id]);
      if (values.length === 0 || values.some((value) => value === null || value === undefined)) {
        thrown.add(request.rollId);
        return;
      }
      if (!thrown.has(request.rollId)) {
        return;
      }
      reported.add(request.rollId);
      const finished = values as number[];
      const byId: Record<string, number> = {};
      dice.forEach((die, index) => (byId[die.id] = finished[index]));
      sendRollResult(request.source, {
        rollId: request.rollId,
        label: request.label,
        notation: request.notation,
        values: finished,
        ...partResult(roll, byId),
        ...(roll.combination === "PARTS"
          ? { parts: roll.dice.filter(isDice).map((part) => ({ values: getDieFromDice(part).map((die) => byId[die.id]), ...partResult(part, byId) })) }
          : {}),
        hidden: !!roll.hidden,
        modified: roll.modified,
      });
    });
  }, []);
  return null;
}
