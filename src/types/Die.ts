import { isPlainObject } from "is-plain-object";

import { DiceStyle } from "./DiceStyle";
import { DiceType } from "./DiceType";

export interface Die {
  id: string;
  style: DiceStyle;
  type: DiceType;
  /** Custom dice only: the colours, carried with the roll so every player sees them */
  colors?: DieColors;
}

/** Hex colours ("#2a6fdb") for a custom die's body and numbers */
export interface DieColors {
  base: string;
  ink: string;
}

export function isDie(value: any): value is Die {
  return isPlainObject(value) && typeof value.id === "string";
}
