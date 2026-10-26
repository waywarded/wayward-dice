import { getPluginId } from "../plugin/getPluginId";

/**
 * The shared roll log. Each player's client writes its own last rolls under its
 * own room metadata key, so two players rolling at once can't overwrite each
 * other, and late joiners still see them. OBR's room metadata (16 KB) is shared
 * with every extension, so entries are compact and few.
 */
export const HISTORY_KEY_PREFIX = getPluginId("history/");
export const ENTRIES_PER_PLAYER = 8;
export const ENTRIES_SHOWN = 30;

export interface HistoryEntry {
  /** Unique per roll */
  i: string;
  /** Epoch seconds */
  t: number;
  /** Who rolled */
  p: string;
  /** Their colour */
  c?: string;
  /** The sheet's label, e.g. "Hilda: Swords (STR) ≤ 12" */
  l?: string;
  /** Notation, e.g. "2d20kl1" */
  n?: string;
  /** The result as read, e.g. "7", "2 successes" */
  r?: string;
  /** Faces, comma separated */
  v?: string;
  /** A hidden (GM) roll: who and when only */
  h?: 1;
}

export const historyKey = (playerId: string) => `${HISTORY_KEY_PREFIX}${playerId}`;

/** Newest first, capped for one player's key */
export function addEntry(entries: HistoryEntry[], entry: HistoryEntry) {
  return [entry, ...entries.filter((e) => e.i !== entry.i)].slice(0, ENTRIES_PER_PLAYER);
}

export function isHistoryEntry(value: unknown): value is HistoryEntry {
  const v = value as Partial<HistoryEntry> | null;
  return !!v && typeof v.i === "string" && typeof v.t === "number" && typeof v.p === "string";
}

/**
 * Everyone's entries from room metadata, newest first. A hidden roll this
 * player made shows in full from their own local log.
 */
export function mergeHistory(
  metadata: Record<string, unknown>,
  local: HistoryEntry[] = []
): HistoryEntry[] {
  const byId = new Map(local.map((entry) => [entry.i, entry]));
  const entries: HistoryEntry[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (key.startsWith(HISTORY_KEY_PREFIX) && Array.isArray(value)) {
      for (const entry of value) {
        if (isHistoryEntry(entry)) {
          entries.push(entry.h && byId.has(entry.i) ? byId.get(entry.i)! : entry);
        }
      }
    }
  }
  return entries.sort((a, b) => b.t - a.t).slice(0, ENTRIES_SHOWN);
}

/** The room metadata update that empties the log (GM) */
export function clearedHistory(metadata: Record<string, unknown>) {
  const update: Record<string, undefined> = {};
  for (const key of Object.keys(metadata)) {
    if (key.startsWith(HISTORY_KEY_PREFIX)) {
      update[key] = undefined;
    }
  }
  return update;
}

const LOCAL_KEY = getPluginId("hiddenHistory");

/** This player's hidden rolls in full, kept only in this browser */
export function loadLocalHidden(): HistoryEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry) : [];
  } catch {
    return [];
  }
}

export function saveLocalHidden(entry: HistoryEntry) {
  try {
    const entries = [entry, ...loadLocalHidden()].slice(0, ENTRIES_SHOWN);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  } catch {}
}
