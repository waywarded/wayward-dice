import { CritRule, Dice } from "./Dice";
import type { RollRequestMeta } from "../api/protocol";

/**
 * The roll of a set of dice.
 * See `Dice` type for examples of usage
 */
export interface DiceRoll extends Dice {
  hidden?: boolean;
  /** Set when another extension asked for this roll, so the result goes back to it */
  request?: RollRequestMeta;
  /** A staged request the player changed before rolling */
  modified?: boolean;
  /** Critical faces of the kept die, fixed when the roll starts so every client agrees */
  crit?: CritRule;
  /** Pushed once: the failed dice were rolled again */
  pushed?: boolean;
}
