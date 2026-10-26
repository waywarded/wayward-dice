let index = 0;
// The panel and the background popover are separate frames with their own
// counters, and the panel restarts at 0 each time it opens
const prefix = Math.random().toString(36).slice(2, 6);

/** Get an incrementing id to use as a dice id */
export function generateDiceId() {
  index++;
  return `${prefix}${index}`;
}
