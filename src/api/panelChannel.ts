import { getPluginId } from "../plugin/getPluginId";
import { RollRequest } from "./protocol";

/**
 * The background popover and the dice panel (action popover) are separate
 * iframes on one origin; they talk over a BroadcastChannel.
 */
export type PanelMessage =
  | { type: "roll" | "stage"; request: RollRequest }
  | { type: "ack"; rollId: string; error?: string };

const CHANNEL = getPluginId("panel");

export function openPanelChannel(onMessage: (message: PanelMessage) => void) {
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (event) => onMessage(event.data as PanelMessage);
  return channel;
}

/**
 * Post to the panel until it acknowledges, re-posting while it may still be
 * loading. Resolves to the ack, or null if the panel never answered.
 */
export function sendToPanel(
  message: Extract<PanelMessage, { request: RollRequest }>,
  timeoutMs: number,
  retryMs = 250
): Promise<Extract<PanelMessage, { type: "ack" }> | null> {
  return new Promise((resolve) => {
    const channel = openPanelChannel((reply) => {
      if (reply.type === "ack" && reply.rollId === message.request.rollId) {
        done(reply);
      }
    });
    const post = () => channel.postMessage(message);
    const retry = setInterval(post, retryMs);
    const timeout = setTimeout(() => done(null), timeoutMs);
    function done(ack: Extract<PanelMessage, { type: "ack" }> | null) {
      clearInterval(retry);
      clearTimeout(timeout);
      channel.close();
      resolve(ack);
    }
    post();
  });
}
