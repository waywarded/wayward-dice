import { create } from "zustand";
import { Advantage } from "../controls/store";
import { getPluginId } from "../plugin/getPluginId";

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

interface SettingsState {
  room: RoomSettings;
  setRoom: (room: RoomSettings) => void;
  isGm: boolean;
  /** Per player, shared by the panel and the popover through localStorage */
  othersRolls: OthersRolls;
  setOthersRolls: (value: OthersRolls) => void;
  autoOpen: AutoOpen;
  setAutoOpen: (value: AutoOpen) => void;
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
