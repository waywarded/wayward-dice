import { isPlainObject } from "is-plain-object";

import { Die } from "./Die";

/**
 * The roll of a set of dice.
 * @example <caption>2d6 with a +6 bonus to the entire roll</caption>
 * {
 *  dice: [
 *    {id: "123", set: "NEBULA", type: "D6"},
 *    {id: "234", set: "NEBULA", type: "D6"},
 *  ],
 *  bonus: 6
 * }
 *
 * @example <caption>1d6+3 + 1d8</caption>
 * {
 *  dice: [
 *    {
 *      dice: [{id: "123", set: "NEBULA", type: "D6"}],
 *      bonus: 3
 *    },
 *    {id: "234", set: "NEBULA", type: "D8"}]
 *  ],
 * }
 *
 * @example <caption>A D20 rolled at advantage with a bonus +6 to the roll</caption>
 * {
 *  dice: [
 *    {id: "123", set: "NEBULA", type: "D20"},
 *    {id: "234", set: "NEBULA", type: "D20"}
 *  ],
 *  combination: "HIGHEST",
 *  bonus: 6
 * }
 *
 * @example <caption>A single D100 rolled with an added D10</caption>
 * {
 *  dice: [
 *    {id: "123", set: "NEBULA", type: "D100"},
 *    {id: "234", set: "NEBULA", type: "D10"}
 *  ],
 * }
 *
 * @example <caption>A D100 and D10 rolled at advantage</caption>
 * {
 *  dice: [
 *    {
 *       dice: [
 *        {id: "123", set: "NEBULA", type: "D100"},
 *        {id: "234", set: "NEBULA", type: "D10"}
 *      ],
 *    },
 *    {
 *      dice: [
 *        {id: "345", set: "NEBULA", type: "D100"},
 *        {id: "456", set: "NEBULA", type: "D10"}
 *      ],
 *    },
 *  ],
 *  combination: "HIGHEST",
 * }
 *
 */
export interface Dice {
  dice: (Die | Dice)[];
  /**
   * How to combine the dice for this roll (defaults to `SUM` if undefined).
   * `D66` reads two d6 as tens and units (11–66). `COUNT` is the number of
   * dice that meet `count`. `PARTS` keeps each child's result apart
   * (`1d6+2, 1d10, 1d10`).
   */
  combination?: "HIGHEST" | "LOWEST" | "SUM" | "NONE" | "D66" | "COUNT" | "PARTS";
  bonus?: number;
  /** With `COUNT`: which faces are successes */
  count?: CountRule;
}

/** A die succeeds when its face compares to the target, e.g. `{ op: ">=", target: 6 }` */
export interface CountRule {
  op: "=" | ">" | ">=" | "<" | "<=";
  target: number;
}

export function meetsCount(value: number, { op, target }: CountRule) {
  switch (op) {
    case "=":
      return value === target;
    case ">":
      return value > target;
    case ">=":
      return value >= target;
    case "<":
      return value < target;
    case "<=":
      return value <= target;
  }
}

/** How a count rule reads, e.g. "≥ 6" */
export function countRuleLabel({ op, target }: CountRule) {
  const symbol = { "=": "=", ">": ">", ">=": "≥", "<": "<", "<=": "≤" }[op];
  return `${symbol} ${target}`;
}

export function isDice(value: any): value is Dice {
  return isPlainObject(value) && Array.isArray(value.dice);
}
