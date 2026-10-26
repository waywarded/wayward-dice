import { useDiceRollStore } from "../dice/store";
import { useDiceControlsStore } from "../controls/store";
import { getDiceFromNotation, ParsedNotation } from "./notation";
import { RollRequest, sendRollError } from "./protocol";

/** A throw settles within 5 s; one still going after this is stuck (e.g. a frozen tab) */
const STUCK_ROLL_MS = 15_000;
let requestStartedAt = 0;

/** Throw a request's dice through the dice roll store, as the Roll button does */
export function rollFromRequest(request: RollRequest, parsed: ParsedNotation) {
  // Replacing a requested roll mid-throw would leave its sender without an answer
  const current = useDiceRollStore.getState();
  const inFlight =
    current.roll?.request &&
    Object.values(current.rollValues).some((value) => value === null);
  if (inFlight && current.roll?.request) {
    if (performance.now() - requestStartedAt < STUCK_ROLL_MS) {
      throw new Error("Roll in progress");
    }
    const stuck = current.roll.request;
    sendRollError(stuck.source, stuck.rollId, "Roll timed out");
  }
  requestStartedAt = performance.now();
  const { diceSet } = useDiceControlsStore.getState();
  const style = diceSet.dice[0].style;
  useDiceRollStore.getState().startRoll({
    dice: getDiceFromNotation(parsed, style),
    bonus: parsed.bonus,
    hidden: request.visibility === "gm",
    request: {
      rollId: request.rollId,
      source: request.source,
      label: request.label,
      notation: request.notation,
    },
  });
}

/**
 * Fill the dice picker from a request without throwing.
 * Returns an error message when the picker can't show it.
 */
export function stageRequest(request: RollRequest, parsed: ParsedNotation): string | null {
  const controls = useDiceControlsStore.getState();
  const keeps = parsed.groups.filter((group) => group.keep);
  if (keeps.length > 1 || (keeps.length === 1 && keeps[0].count !== 2)) {
    return "The dice panel can only keep the highest or lowest of two dice";
  }
  const counts: Record<string, number> = {};
  for (const group of parsed.groups) {
    const die = controls.diceSet.dice.find((d) => d.type === group.type);
    if (!die) {
      return `No ${group.type.toLowerCase()} in this dice set`;
    }
    counts[die.id] = (counts[die.id] ?? 0) + (group.keep ? 1 : group.count);
  }
  controls.resetDiceCounts();
  for (const [id, count] of Object.entries(counts)) {
    controls.changeDieCount(id, count);
  }
  controls.setDiceBonus(parsed.bonus);
  controls.setDiceAdvantage(
    keeps[0]?.keep === "HIGHEST" ? "ADVANTAGE" : keeps[0]?.keep === "LOWEST" ? "DISADVANTAGE" : null
  );
  if (request.visibility === "gm" && !controls.diceHidden) {
    controls.toggleDiceHidden();
  }
  // Read back after the updates so "modified" compares like with like
  const staged = useDiceControlsStore.getState();
  controls.setStagedRequest({
    meta: {
      rollId: request.rollId,
      source: request.source,
      label: request.label,
      notation: request.notation,
    },
    counts: staged.diceCounts,
    bonus: staged.diceBonus,
    advantage: staged.diceAdvantage,
  });
  return null;
}
