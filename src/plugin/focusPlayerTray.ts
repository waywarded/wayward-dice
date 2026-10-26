import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";

/** How long to keep asking: a panel opened just now takes a moment to load */
const RETRY_FOR_MS = 3000;
const RETRY_EVERY_MS = 250;

/** Open the dice panel on another player's tray (the panel's PartyTrays listens) */
export function focusPlayerTray(connectionId: string) {
  if (!window.BroadcastChannel) {
    return;
  }
  OBR.action.open();
  const channel = new BroadcastChannel(getPluginId("focused-tray"));
  const post = () => channel.postMessage(connectionId);
  post();
  const retry = setInterval(post, RETRY_EVERY_MS);
  setTimeout(() => {
    clearInterval(retry);
    channel.close();
  }, RETRY_FOR_MS);
}
