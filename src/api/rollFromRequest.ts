import { useDiceRollStore } from "../dice/store";
import { MAX_ADVANTAGE_COUNT, useDiceControlsStore } from "../controls/store";
import { getRollFromNotation, ParsedNotation } from "./notation";
import { RollRequest, sendRollError } from "./protocol";

/** A throw settles within 5 s; one still going after this is stuck (e.g. a frozen tab) */
const STUCK_ROLL_MS = 15_000;
let requestStartedAt = 0;

/** A requested roll that hasn't come to rest yet; replacing it would leave its sender without an answer */
function requestInFlight() {
  const current = useDiceRollStore.getState();
  return current.roll?.request &&
    Object.values(current.rollValues).some((value) => value === null)
    ? current.roll.request
    : null;
}

/** Throw a request's dice through the dice roll store, as the Roll button does */
export function rollFromRequest(request: RollRequest, parsed: ParsedNotation) {
  const inFlight = requestInFlight();
  if (inFlight) {
    if (performance.now() - requestStartedAt < STUCK_ROLL_MS) {
      throw new Error("Roll in progress");
    }
    sendRollError(inFlight.source, inFlight.rollId, "Roll timed out");
  }
  requestStartedAt = performance.now();
  const { diceSet } = useDiceControlsStore.getState();
  const style = diceSet.dice[0].style;
  useDiceRollStore.getState().startRoll({
    ...getRollFromNotation(parsed, style),
    hidden: request.visibility === "gm",
    request: {
      rollId: request.rollId,
      source: request.source,
      label: request.label,
      notation: request.notation,
      ...(request.crit ? { crit: request.crit } : {}),
    },
  });
}

/**
 * Fill the dice picker from a request without throwing.
 * Returns an error message when the picker can't show it.
 */
export function stageRequest(request: RollRequest, parsed: ParsedNotation): string | null {
  if (requestInFlight()) {
    return "Roll in progress";
  }
  if (parsed.parts.length > 1) {
    return "The dice panel can't show a roll in several parts";
  }
  const [part] = parsed.parts;
  if (part.groups.some((group) => group.d66)) {
    return "The dice panel can't show a d66";
  }
  // The panel's keep applies to every die picked, so it can only show a keep on its own
  const keeps = part.groups.filter((group) => group.keep);
  if (keeps.length > 0 && part.groups.length > 1) {
    return "The dice panel can only keep the highest or lowest of one kind of die";
  }
  if (keeps[0] && keeps[0].count - 1 > MAX_ADVANTAGE_COUNT) {
    return `The dice panel can keep one of up to ${MAX_ADVANTAGE_COUNT + 1} dice`;
  }
  const controls = useDiceControlsStore.getState();
  const counts: Record<string, number> = {};
  for (const group of part.groups) {
    const die = controls.diceSet.dice.find((d) => d.type === group.type);
    if (!die) {
      return `No ${group.type.toLowerCase()} in this dice set`;
    }
    counts[die.id] = (counts[die.id] ?? 0) + (group.keep ? 1 : group.count);
  }
  // Start from an empty tray, as a fresh panel would
  useDiceRollStore.getState().clearRoll();
  controls.resetDiceCounts();
  for (const [id, count] of Object.entries(counts)) {
    controls.changeDieCount(id, count);
  }
  controls.setDiceBonus(part.bonus);
  controls.setDiceCount(part.count ?? null);
  controls.setDiceAdvantage(keeps[0]?.keep === "HIGHEST" ? "ADVANTAGE" : keeps[0]?.keep === "LOWEST" ? "DISADVANTAGE" : null);
  if (keeps[0]) {
    controls.setDiceAdvantageCount(keeps[0].count - 1);
  }
  // An earlier staged request that was never rolled is replaced, and keeps the original toggle
  const previous = controls.stagedRequest;
  if (previous && previous.meta.rollId !== request.rollId) {
    sendRollError(previous.meta.source, previous.meta.rollId, "Cancelled");
  }
  const hiddenBefore = controls.stagedRequest?.hiddenBefore ?? controls.diceHidden;
  controls.setDiceHidden(request.visibility === "gm");
  // Read back after the updates so "modified" compares like with like
  const staged = useDiceControlsStore.getState();
  controls.setStagedRequest({
    meta: {
      rollId: request.rollId,
      source: request.source,
      label: request.label,
      notation: request.notation,
      ...(request.crit ? { crit: request.crit } : {}),
    },
    counts: staged.diceCounts,
    bonus: staged.diceBonus,
    advantage: staged.diceAdvantage,
    advantageCount: staged.diceAdvantageCount,
    count: staged.diceCount,
    hiddenBefore,
  });
  return null;
}
