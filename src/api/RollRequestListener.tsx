import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useRef } from "react";
import { parseNotation } from "./notation";
import { openPanelChannel, sendToPanel } from "./panelChannel";
import {
  IS_READY_CHANNEL,
  isRollRequest,
  ROLL_REQUEST_CHANNEL,
  sendRollError,
} from "./protocol";
import { rollFromRequest } from "./rollFromRequest";
import { useDiceRollStore } from "../dice/store";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { getPluginId } from "../plugin/getPluginId";
import { DiceRoll } from "../types/DiceRoll";
import { DiceThrow } from "../types/DiceThrow";
import { DiceTransform } from "../types/DiceTransform";

/** How long a staged roll waits for the dice panel to load and answer */
const STAGE_TIMEOUT = 10_000;
/** An open panel answers within a frame or two; after this, roll here instead */
const OPEN_PANEL_TIMEOUT = 800;

/**
 * Lives in the always-present background popover, so requests are heard even
 * when the dice panel is closed. Only this frame listens to OBR broadcasts;
 * the panel gets requests from here, so nothing rolls twice.
 */
export function RollRequestListener() {
  // Staged requests the panel holds, so closing it doesn't leave their senders waiting
  const pendingStaged = useRef(new Map<string, string>());

  useEffect(() => {
    const channel = openPanelChannel(async (message) => {
      if (message.type === "staged-done") {
        pendingStaged.current.delete(message.rollId);
      } else if (message.type === "roll-state?") {
        const state = await finishedRollToHandOver();
        if (state) {
          channel.postMessage({ type: "roll-state", state });
        }
      }
    });
    const unsubscribe = OBR.action.onOpenChange((open) => {
      if (!open && pendingStaged.current.size > 0) {
        for (const [rollId, source] of pendingStaged.current) {
          sendRollError(source, rollId, "Cancelled");
        }
        pendingStaged.current.clear();
        channel.postMessage({ type: "cancel-staged" });
      }
    });
    return () => {
      unsubscribe();
      channel.close();
    };
  }, []);

  useEffect(
    () =>
      OBR.broadcast.onMessage(IS_READY_CHANNEL, ({ data }) => {
        const d = data as { requestId?: unknown; ready?: unknown } | null;
        // Our own answer comes back on this channel too
        if (d && d.ready === undefined) {
          OBR.broadcast.sendMessage(
            IS_READY_CHANNEL,
            { requestId: d.requestId, ready: true, timestamp: Date.now() },
            { destination: "LOCAL" }
          );
        }
      }),
    []
  );

  useEffect(
    () =>
      OBR.broadcast.onMessage(ROLL_REQUEST_CHANNEL, async ({ data }) => {
        if (!isRollRequest(data)) {
          return;
        }
        const request = data;
        let parsed;
        try {
          parsed = parseNotation(request.notation);
        } catch (e) {
          sendRollError(request.source, request.rollId, (e as Error).message);
          return;
        }

        if (request.mode === "stage") {
          await OBR.action.open();
          const ack = await sendToPanel({ type: "stage", request }, STAGE_TIMEOUT);
          if (!ack || ack.error) {
            sendRollError(
              request.source,
              request.rollId,
              ack?.error ?? "The dice panel didn't open"
            );
          } else {
            pendingStaged.current.set(request.rollId, request.source);
          }
          return;
        }

        // With the panel open, roll in its tray as if the player pressed Roll
        if (await OBR.action.isOpen()) {
          const ack = await sendToPanel({ type: "roll", request }, OPEN_PANEL_TIMEOUT);
          if (ack?.error) {
            sendRollError(request.source, request.rollId, ack.error);
          }
          if (ack) {
            return;
          }
        }
        try {
          rollFromRequest(request, parsed);
        } catch (e) {
          sendRollError(request.source, request.rollId, (e as Error).message);
        }
      }),
    []
  );

  return null;
}

/**
 * This frame's last roll, if it finished and is still the player's latest
 * (the synced metadata shows the same dice), so the panel can show it.
 */
async function finishedRollToHandOver() {
  const { roll, rollValues, rollTransforms, rollThrows } = useDiceRollStore.getState();
  if (!roll) {
    return null;
  }
  const values = Object.values(rollValues);
  if (values.length === 0 || values.some((value) => value === null)) {
    return null;
  }
  const metadata = await OBR.player.getMetadata();
  const synced = metadata[getPluginId("roll")] as DiceRoll | undefined;
  const ids = (dice: DiceRoll) => getDieFromDice(dice).map((die) => die.id).join();
  if (!synced || ids(synced) !== ids(roll)) {
    return null;
  }
  return {
    roll,
    rollValues: rollValues as Record<string, number>,
    rollTransforms: rollTransforms as Record<string, DiceTransform>,
    rollThrows: rollThrows as Record<string, DiceThrow>,
  };
}
