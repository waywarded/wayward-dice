import { useEffect } from "react";
import { parseNotation } from "./notation";
import { openPanelChannel } from "./panelChannel";
import { rollFromRequest, stageRequest } from "./rollFromRequest";

/** In the dice panel: runs requests the background popover hands over */
export function PanelApiBridge() {
  useEffect(() => {
    // The popover re-posts until acked, so the same request can arrive twice
    const handled = new Map<string, string | undefined>();
    const channel = openPanelChannel((message) => {
      if (message.type === "ack") {
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
    return () => channel.close();
  }, []);
  return null;
}
