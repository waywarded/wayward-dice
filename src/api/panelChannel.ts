import { getPluginId } from "../plugin/getPluginId";
import { RollRequest } from "./protocol";
import type { DiceRoll } from "../types/DiceRoll";
import type { DiceThrow } from "../types/DiceThrow";
import type { DiceTransform } from "../types/DiceTransform";

/** A finished roll, handed from the popover to the panel so it shows there too */
export interface FinishedRollState {
  roll: DiceRoll;
  rollValues: Record<string, number>;
  rollTransforms: Record<string, DiceTransform>;
  rollThrows: Record<string, DiceThrow>;
}

/**
 * The background popover and the dice panel (action popover) are separate
 * iframes on one origin; they talk over a BroadcastChannel.
 */
export type PanelMessage =
  // popover → panel: run a request; panel → popover: done, or why not
  | { type: "roll" | "stage"; request: RollRequest }
  | { type: "ack"; rollId: string; error?: string }
  // panel → popover: a staged request was rolled or cleared
  | { type: "staged-done"; rollId: string }
  // popover → panel: the panel closed with a request still staged
  | { type: "cancel-staged" }
  // panel → popover: "what did you roll?"; popover → panel: its last finished roll
  | { type: "roll-state?" }
  | { type: "roll-state"; state: FinishedRollState };

const CHANNEL = getPluginId("panel");

export function openPanelChannel(onMessage: (message: PanelMessage) => void) {
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (event) => onMessage(event.data as PanelMessage);
  return channel;
}

/** Post one message without listening for answers */
export function postToPanelChannel(message: PanelMessage) {
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage(message);
  channel.close();
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
