import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { diceSets } from "../sets/diceSets";
import { CountRule, Dice } from "../types/Dice";
import { DiceSet } from "../types/DiceSet";
import { Die } from "../types/Die";
import { generateDiceId } from "../helpers/generateDiceId";
import type { RollRequestMeta } from "../api/protocol";
import { getPluginId } from "../plugin/getPluginId";

export type Advantage = "ADVANTAGE" | "DISADVANTAGE" | null;
export type DiceCounts = Record<string, number>;

/** A roll another extension filled in, waiting for the player to press Roll */
export interface StagedRequest {
  meta: RollRequestMeta;
  counts: DiceCounts;
  bonus: number;
  advantage: Advantage;
  advantageCount: number;
  count: CountRule | null;
  /** The hidden toggle before staging, put back once the roll is thrown or cleared */
  hiddenBefore: boolean;
}

/** The most extra dice a keep-highest/lowest roll can add per die */
export const MAX_ADVANTAGE_COUNT = 5;

const DICE_SET_KEY = getPluginId("diceSet");

/** The chosen set is shared through localStorage so the panel and popover throw the same dice */
function loadDiceSet(): DiceSet {
  try {
    const id = localStorage.getItem(DICE_SET_KEY);
    return diceSets.find((set) => set.id === id) ?? diceSets[0];
  } catch {
    return diceSets[0];
  }
}

function saveDiceSet(diceSet: DiceSet) {
  try {
    localStorage.setItem(DICE_SET_KEY, diceSet.id);
  } catch {}
}

interface DiceControlsState {
  diceSet: DiceSet;
  diceById: Record<string, Die>;
  defaultDiceCounts: DiceCounts;
  diceCounts: DiceCounts;
  diceBonus: number;
  diceAdvantage: Advantage;
  /** Extra dice rolled per die when keeping the highest or lowest (1 = Adv/Dis) */
  diceAdvantageCount: number;
  /** Count the dice that meet this rule instead of adding them up (Vaesen pools) */
  diceCount: CountRule | null;
  diceHidden: boolean;
  diceRollPressTime: number | null;
  fairnessTesterOpen: boolean;
  stagedRequest: StagedRequest | null;
  setStagedRequest: (staged: StagedRequest | null) => void;
  changeDiceSet: (diceSet: DiceSet) => void;
  resetDiceCounts: () => void;
  changeDieCount: (id: string, count: number) => void;
  incrementDieCount: (id: string) => void;
  decrementDieCount: (id: string) => void;
  setDiceAdvantage: (advantage: Advantage) => void;
  setDiceAdvantageCount: (count: number) => void;
  setDiceCount: (count: CountRule | null) => void;
  setDiceHidden: (hidden: boolean) => void;
  setDiceBonus: (bonus: number) => void;
  toggleDiceHidden: () => void;
  setDiceRollPressTime: (time: number | null) => void;
  toggleFairnessTester: () => void;
}

const initialSet = loadDiceSet();
const initialDiceCounts = getDiceCountsFromSet(initialSet);
const initialDiceById = getDiceByIdFromSet(initialSet);

export const useDiceControlsStore = create<DiceControlsState>()(
  immer((set) => ({
    diceSet: initialSet,
    diceById: initialDiceById,
    defaultDiceCounts: initialDiceCounts,
    diceCounts: initialDiceCounts,
    diceBonus: 0,
    diceAdvantage: null,
    diceAdvantageCount: 1,
    diceCount: null,
    diceHidden: false,
    diceRollPressTime: null,
    fairnessTesterOpen: false,
    stagedRequest: null,
    setStagedRequest(staged) {
      set((state) => {
        state.stagedRequest = staged;
      });
    },
    changeDiceSet(diceSet) {
      set((state) => {
        const counts: DiceCounts = {};
        const prevCounts = state.diceCounts;
        const prevDice = state.diceSet.dice;
        for (let i = 0; i < diceSet.dice.length; i++) {
          const die = diceSet.dice[i];
          const prevDie = prevDice[i];
          // Carry over count if the index and die type match
          if (prevDie && prevDie.type === die.type) {
            counts[die.id] = prevCounts[prevDie.id] || 0;
          } else {
            counts[die.id] = 0;
          }
        }
        state.diceCounts = counts;
        state.diceSet = diceSet;
        state.defaultDiceCounts = getDiceCountsFromSet(diceSet);
        state.diceById = getDiceByIdFromSet(diceSet);
      });
      saveDiceSet(diceSet);
    },
    resetDiceCounts() {
      set((state) => {
        state.diceCounts = state.defaultDiceCounts;
      });
    },
    changeDieCount(id, count) {
      set((state) => {
        if (id in state.diceCounts) {
          state.diceCounts[id] = count;
        }
      });
    },
    incrementDieCount(id) {
      set((state) => {
        if (id in state.diceCounts) {
          state.diceCounts[id] += 1;
        }
      });
    },
    decrementDieCount(id) {
      set((state) => {
        if (id in state.diceCounts) {
          state.diceCounts[id] -= 1;
        }
      });
    },
    setDiceBonus(bonus) {
      set((state) => {
        state.diceBonus = bonus;
      });
    },
    setDiceAdvantage(advantage) {
      set((state) => {
        state.diceAdvantage = advantage;
        if (advantage === null) {
          state.diceAdvantageCount = 1;
        } else {
          // A count of successes looks at every die, so it can't keep only one
          state.diceCount = null;
        }
      });
    },
    setDiceAdvantageCount(count) {
      set((state) => {
        state.diceAdvantageCount = Math.max(1, Math.min(MAX_ADVANTAGE_COUNT, count));
      });
    },
    setDiceCount(count) {
      set((state) => {
        state.diceCount = count;
        if (count) {
          state.diceAdvantage = null;
          state.diceAdvantageCount = 1;
          state.diceBonus = 0;
        }
      });
    },
    setDiceHidden(hidden) {
      set((state) => {
        state.diceHidden = hidden;
      });
    },
    toggleDiceHidden() {
      set((state) => {
        state.diceHidden = !state.diceHidden;
      });
    },
    setDiceRollPressTime(time) {
      set((state) => {
        state.diceRollPressTime = time;
      });
    },
    toggleFairnessTester() {
      set((state) => {
        state.fairnessTesterOpen = !state.fairnessTesterOpen;
      });
    },
  }))
);

function getDiceCountsFromSet(diceSet: DiceSet) {
  const counts: Record<string, number> = {};
  for (const die of diceSet.dice) {
    counts[die.id] = 0;
  }
  return counts;
}

function getDiceByIdFromSet(diceSet: DiceSet) {
  const byId: Record<string, Die> = {};
  for (const die of diceSet.dice) {
    byId[die.id] = die;
  }
  return byId;
}

/** Generate new dice based off of a set of counts, advantage and die */
export function getDiceToRoll(
  counts: DiceCounts,
  advantage: Advantage,
  diceById: Record<string, Die>,
  advantageCount = 1
) {
  const dice: (Die | Dice)[] = [];
  const countEntries = Object.entries(counts);
  for (const [id, count] of countEntries) {
    const die = diceById[id];
    if (!die) {
      continue;
    }
    const { style, type } = die;
    // Push a d100 and d10 when rolling a d100
    const single = (): Die | Dice =>
      type === "D100"
        ? {
            dice: [
              { id: generateDiceId(), style, type: "D100" },
              { id: generateDiceId(), style, type: "D10" },
            ],
          }
        : { id: generateDiceId(), style, type };
    for (let i = 0; i < count; i++) {
      if (advantage === null) {
        dice.push(single());
      } else {
        // Keep the highest or lowest of the die and its extra copies
        dice.push({
          dice: Array.from({ length: 1 + advantageCount }, single),
          combination: advantage === "ADVANTAGE" ? "HIGHEST" : "LOWEST",
        });
      }
    }
  }
  return dice;
}

/** Re-read the dice set when another frame (panel or popover) changes it */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === DICE_SET_KEY) {
      const next = loadDiceSet();
      const state = useDiceControlsStore.getState();
      if (next.id !== state.diceSet.id) {
        state.changeDiceSet(next);
      }
    }
  });
}

/** The roll the picker describes: dice added up with a bonus, or counted against a rule */
export function getPickedRoll(
  dice: (Die | Dice)[],
  bonus: number,
  count: CountRule | null
): Dice {
  return count ? { dice, combination: "COUNT", count } : { dice, bonus };
}
