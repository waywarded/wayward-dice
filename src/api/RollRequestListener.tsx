import OBR from "@owlbear-rodeo/sdk";
import { useEffect } from "react";
import { parseNotation } from "./notation";
import { sendToPanel } from "./panelChannel";
import {
  IS_READY_CHANNEL,
  isRollRequest,
  ROLL_REQUEST_CHANNEL,
  sendRollError,
} from "./protocol";
import { rollFromRequest } from "./rollFromRequest";

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
        rollFromRequest(request, parsed);
      }),
    []
  );

  return null;
}
