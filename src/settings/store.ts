import { create } from "zustand";
import { Advantage } from "../controls/store";
import { getPluginId } from "../plugin/getPluginId";
import { CustomDice, DEFAULT_CUSTOM_DICE, isHexColor } from "../helpers/customColors";

/** What the keep-highest/lowest toggle is called in this room */
export type KeepNames = "ADVANTAGE" | "BOON";

export interface RoomSettings {
  keepNames: KeepNames;
  /** The GM lets players push a roll once: re-roll what failed */
  pushes: boolean;
}

export const ROOM_SETTINGS_KEY = getPluginId("settings");

export const DEFAULT_ROOM_SETTINGS: RoomSettings = { keepNames: "ADVANTAGE", pushes: false };

export function parseRoomSettings(value: unknown): RoomSettings {
  const v = (value ?? {}) as Partial<RoomSettings>;
  return {
    keepNames: v.keepNames === "BOON" ? "BOON" : "ADVANTAGE",
    pushes: v.pushes === true,
  };
}

/** How other players' rolls show in the corner: the 3D tray, or just the result */
export type OthersRolls = "TRAY" | "RESULT";

const OTHERS_ROLLS_KEY = getPluginId("othersRolls");

function loadOthersRolls(): OthersRolls {
  try {
    return localStorage.getItem(OTHERS_ROLLS_KEY) === "RESULT" ? "RESULT" : "TRAY";
  } catch {
    return "TRAY";
  }
}

/** When the dice panel opens by itself: never, for this player's requested rolls, or for everyone's */
export type AutoOpen = "NEVER" | "MINE" | "ALL";

const AUTO_OPEN_KEY = getPluginId("autoOpen");

function loadAutoOpen(): AutoOpen {
  try {
    const value = localStorage.getItem(AUTO_OPEN_KEY);
    return value === "NEVER" || value === "ALL" ? value : "MINE";
  } catch {
    return "MINE";
  }
}

const CUSTOM_DICE_KEY = getPluginId("customDice");

function loadCustomDice(): CustomDice {
  try {
    const v = JSON.parse(localStorage.getItem(CUSTOM_DICE_KEY) ?? "null") as Partial<CustomDice> | null;
    return {
      base: isHexColor(v?.base) ? v.base : DEFAULT_CUSTOM_DICE.base,
      ink: isHexColor(v?.ink) ? v.ink : DEFAULT_CUSTOM_DICE.ink,
      rainbow: v?.rainbow === true,
    };
  } catch {
    return DEFAULT_CUSTOM_DICE;
  }
}

const FELT_KEY = getPluginId("feltColor");

function loadFeltColor(): string | null {
  try {
    const value = localStorage.getItem(FELT_KEY);
    return isHexColor(value) ? value : null;
  } catch {
    return null;
  }
}

interface SettingsState {
  room: RoomSettings;
  setRoom: (room: RoomSettings) => void;
  isGm: boolean;
  /** Per player, shared by the panel and the popover through localStorage */
  othersRolls: OthersRolls;
  setOthersRolls: (value: OthersRolls) => void;
  autoOpen: AutoOpen;
  setAutoOpen: (value: AutoOpen) => void;
  /** Per player, in this browser; the colours also travel with each custom die rolled */
  customDice: CustomDice;
  setCustomDice: (value: CustomDice) => void;
  /** Per player: the tray's felt colour, or null for the original brown */
  feltColor: string | null;
  setFeltColor: (value: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  room: DEFAULT_ROOM_SETTINGS,
  setRoom: (room) => set({ room }),
  isGm: false,
  othersRolls: loadOthersRolls(),
  setOthersRolls: (othersRolls) => {
    try {
      localStorage.setItem(OTHERS_ROLLS_KEY, othersRolls);
    } catch {}
    set({ othersRolls });
  },
  feltColor: loadFeltColor(),
  setFeltColor: (feltColor) => {
    try {
      if (feltColor) {
        localStorage.setItem(FELT_KEY, feltColor);
      } else {
        localStorage.removeItem(FELT_KEY);
      }
    } catch {}
    set({ feltColor });
  },
  customDice: loadCustomDice(),
  setCustomDice: (customDice) => {
    try {
      localStorage.setItem(CUSTOM_DICE_KEY, JSON.stringify(customDice));
    } catch {}
    set({ customDice });
  },
  autoOpen: loadAutoOpen(),
  setAutoOpen: (autoOpen) => {
    try {
      localStorage.setItem(AUTO_OPEN_KEY, autoOpen);
    } catch {}
    set({ autoOpen });
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === OTHERS_ROLLS_KEY) {
      useSettingsStore.setState({ othersRolls: loadOthersRolls() });
    }
    if (event.key === FELT_KEY) {
      useSettingsStore.setState({ feltColor: loadFeltColor() });
    }
    if (event.key === CUSTOM_DICE_KEY) {
      useSettingsStore.setState({ customDice: loadCustomDice() });
    }
    if (event.key === AUTO_OPEN_KEY) {
      useSettingsStore.setState({ autoOpen: loadAutoOpen() });
    }
  });
}

/**
 * The toggle's two buttons, worse first. Roll-over games keep the highest die
 * for advantage; roll-under games (Dragonbane) keep the lowest for a boon.
 */
export function keepOptions(names: KeepNames): { value: Exclude<Advantage, null>; label: string }[] {
  return names === "BOON"
    ? [
        { value: "ADVANTAGE", label: "Bane" },
        { value: "DISADVANTAGE", label: "Boon" },
      ]
    : [
        { value: "DISADVANTAGE", label: "Dis" },
        { value: "ADVANTAGE", label: "Adv" },
      ];
}

/** "Adv", "Boon ×2", or null without a keep */
export function keepLabel(advantage: Advantage, count: number, names: KeepNames): string | null {
  if (advantage === null) {
    return null;
  }
  const label = keepOptions(names).find((option) => option.value === advantage)!.label;
  return count > 1 ? `${label} ×${count}` : label;
}
