import OBR from "@owlbear-rodeo/sdk";

/**
 * The roll API other extensions use, over OBR broadcast messages sent "LOCAL".
 * Shaped like Dice+'s so a sheet can support both with little code.
 *
 * - `wayward-dice/roll-request` → `{source}/roll-result` or `{source}/roll-error`
 * - `wayward-dice/isReady` `{ requestId }` → answered on the same channel `{ requestId, ready: true }`
 */
export const ROLL_REQUEST_CHANNEL = "wayward-dice/roll-request";
export const IS_READY_CHANNEL = "wayward-dice/isReady";

export interface RollRequest {
  rollId: string;
  /** Answers go to `${source}/roll-result` and `${source}/roll-error` */
  source: string;
  notation: string;
  label?: string;
  visibility?: "all" | "gm";
  /** "roll" throws now; "stage" opens the dice panel filled in, and the player presses Roll */
  mode?: "roll" | "stage";
}

/** Who asked for a roll, carried on the roll so the result can be sent back */
export interface RollRequestMeta {
  rollId: string;
  source: string;
  label?: string;
  notation: string;
}

export interface RollResult {
  rollId: string;
  label?: string;
  notation: string;
  /** Each die's face, in throw order (a d100 pair reports both dice) */
  values: number[];
  total: number | null;
  hidden: boolean;
  /** True when a staged roll was changed in the panel before rolling */
  modified?: boolean;
}

export function isRollRequest(value: unknown): value is RollRequest {
  const v = value as Partial<RollRequest> | null;
  return (
    !!v &&
    typeof v.rollId === "string" &&
    typeof v.source === "string" &&
    typeof v.notation === "string"
  );
}

export function sendRollResult(source: string, result: RollResult) {
  return OBR.broadcast.sendMessage(`${source}/roll-result`, result, {
    destination: "LOCAL",
  });
}

export function sendRollError(source: string, rollId: string, error: string) {
  return OBR.broadcast.sendMessage(
    `${source}/roll-error`,
    { rollId, error },
    { destination: "LOCAL" }
  );
}
