import OBR from "@owlbear-rodeo/sdk";
import { useEffect } from "react";
import { useDiceControlsStore } from "../controls/store";
import { useDiceRollStore } from "../dice/store";
import { parseNotation } from "./notation";
import { openPanelChannel } from "./panelChannel";
import { rollFromRequest, stageRequest } from "./rollFromRequest";

/** In the dice panel: runs requests the background popover hands over */
export function PanelApiBridge() {
  useEffect(() => {
    // The popover re-posts until acked, so the same request can arrive twice
    const handled = new Map<string, string | undefined>();
    const channel = openPanelChannel((message) => {
      if (message.type === "roll-state") {
        // Show what the popover threw while the panel was closed, unless this tray is busy
        const current = useDiceRollStore.getState();
        const busy = Object.values(current.rollValues).some((value) => value === null);
        if (!busy) {
          current.loadFinishedRoll(message.state);
        }
        return;
      }
      if (message.type === "cancel-staged") {
        const controls = useDiceControlsStore.getState();
        const staged = controls.stagedRequest;
        if (staged) {
          controls.setStagedRequest(null);
          controls.setDiceHidden(staged.hiddenBefore);
          controls.resetDiceCounts();
          controls.setDiceBonus(0);
          controls.setDiceAdvantage(null);
        }
        return;
      }
      if (message.type !== "roll" && message.type !== "stage") {
        return;
      }
      const { request } = message;
      if (!handled.has(request.rollId)) {
        let error: string | undefined;
        try {
          const parsed = parseNotation(request.notation);
          if (message.type === "stage") {
            error = stageRequest(request, parsed) ?? undefined;
          } else {
            rollFromRequest(request, parsed);
          }
        } catch (e) {
          error = e instanceof Error ? e.message : String(e);
        }
        handled.set(request.rollId, error);
      }
      channel.postMessage({
        type: "ack",
        rollId: request.rollId,
        error: handled.get(request.rollId),
      });
    });

    // Tell the popover when a staged request is rolled, cleared or replaced
    const unsubscribeStaged = useDiceControlsStore.subscribe((state, previous) => {
      const before = previous.stagedRequest;
      if (before && state.stagedRequest?.meta.rollId !== before.meta.rollId) {
        channel.postMessage({ type: "staged-done", rollId: before.meta.rollId });
      }
    });

    const askForRoll = () => channel.postMessage({ type: "roll-state?" });
    askForRoll();
    // In case OBR keeps the panel's frame alive between opens
    const unsubscribeOpen = OBR.action.onOpenChange((open) => open && askForRoll());

    return () => {
      unsubscribeStaged();
      unsubscribeOpen();
      channel.close();
    };
  }, []);
  return null;
}
