/**
 * Get the reverse domain name id for this plugin at a given path.
 * Distinct from the official Dice (`rodeo.owlbear.dice`) so both can be
 * installed in one room without reading each other's player metadata.
 */
export function getPluginId(path: string) {
  return `com.plotloot.wayward-dice/${path}`;
}
