import { useEffect } from "react";
import { useDiceRollStore } from "../dice/store";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { sendRollResult } from "./protocol";
import { CritRule, Dice, isDice } from "../types/Dice";
import { getRollOutcome } from "../helpers/getRollOutcome";

/** A total, the successes when the dice were counted, and Success/Failure and crits where they apply */
function partResult(dice: Dice & { crit?: CritRule }, values: Record<string, number>) {
  const outcome = getRollOutcome(dice, values);
  return {
    total: outcome?.total ?? null,
    ...(outcome?.successes !== undefined ? { successes: outcome.successes } : {}),
    ...(outcome?.success !== undefined ? { success: outcome.success } : {}),
    ...(outcome?.crit ? { crit: outcome.crit } : {}),
  };
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
      // A push throws again under the same request, and is reported again
      const key = roll && request ? `${request.rollId}${roll.pushed ? ":pushed" : ""}` : "";
      if (!roll || !request || reported.has(key)) {
        return;
      }
      const dice = getDieFromDice(roll);
      const values = dice.map((die) => state.rollValues[die.id]);
      if (values.length === 0 || values.some((value) => value === null || value === undefined)) {
        thrown.add(key);
        return;
      }
      if (!thrown.has(key)) {
        return;
      }
      reported.add(key);
      const finished = values as number[];
      const byId: Record<string, number> = {};
      dice.forEach((die, index) => (byId[die.id] = finished[index]));
      sendRollResult(request.source, {
        rollId: request.rollId,
        label: request.label,
        notation: request.notation,
        values: finished,
        ...partResult(roll, byId),
        ...(roll.pushed ? { pushed: true } : {}),
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
