import OBR from "@owlbear-rodeo/sdk";

/**
 * A stand-in for a character sheet: a separate OBR extension (its own
 * manifest) that drives Wayward Dice only through the broadcast roll API.
 */
const SOURCE = "wayward-dice-test-sheet";

const requests: {
  label: string;
  notation: string;
  visibility?: "all" | "gm";
  mode?: "roll" | "stage";
}[] = [
  { label: "Hilda: Damage", notation: "2d6+1" },
  { label: "Hilda: Swords", notation: "d20" },
  { label: "Attack (adv)", notation: "2d20kh1+3" },
  { label: "Vaesen pool (GM)", notation: "5d6", visibility: "gm" },
  { label: "Percentile", notation: "d100" },
  { label: "Stage: Swords +3", notation: "d20+3", mode: "stage" },
  { label: "Stage: Bane", notation: "2d20kl1", mode: "stage" },
  { label: "Swords, 2 boons", notation: "3d20kl1" },
  { label: "Stage: 2 boons", notation: "3d20kl1", mode: "stage" },
  { label: "Stage: GM ambush", notation: "d20", visibility: "gm", mode: "stage" },
  { label: "Oracle", notation: "d66" },
  { label: "Big pool", notation: "8d6" },
  { label: "Bad notation", notation: "3d7" },
];

const log = (line: string) => {
  const el = document.getElementById("log")!;
  el.textContent = `${new Date().toLocaleTimeString()} ${line}\n${el.textContent}`;
};
const status = (text: string) => (document.getElementById("status")!.textContent = text);

const sentAt = new Map<string, number>();
const elapsed = (rollId: string) => {
  const start = sentAt.get(rollId);
  return start === undefined ? "" : ` (${Math.round(performance.now() - start)} ms)`;
};

function checkReady() {
  const requestId = crypto.randomUUID();
  status("Looking for Wayward Dice…");
  const timeout = setTimeout(() => {
    unsubscribe();
    status("No answer from Wayward Dice: is it installed in this room?");
  }, 2000);
  const unsubscribe = OBR.broadcast.onMessage("wayward-dice/isReady", ({ data }) => {
    const d = data as { requestId?: string; ready?: boolean };
    if (d.requestId === requestId && d.ready) {
      clearTimeout(timeout);
      unsubscribe();
      status("Wayward Dice is ready.");
    }
  });
  OBR.broadcast.sendMessage(
    "wayward-dice/isReady",
    { requestId, timestamp: Date.now() },
    { destination: "LOCAL" }
  );
}

OBR.onReady(() => {
  OBR.broadcast.onMessage(`${SOURCE}/roll-result`, ({ data }) => {
    const r = data as { rollId: string };
    log(`RESULT${elapsed(r.rollId)} ${JSON.stringify(data)}`);
  });
  OBR.broadcast.onMessage(`${SOURCE}/roll-error`, ({ data }) => {
    const r = data as { rollId: string };
    log(`ERROR${elapsed(r.rollId)} ${JSON.stringify(data)}`);
  });

  const buttons = document.getElementById("buttons")!;
  for (const request of requests) {
    const button = document.createElement("button");
    button.textContent = `${request.label} · ${request.notation}`;
    button.onclick = () => {
      const rollId = crypto.randomUUID();
      sentAt.set(rollId, performance.now());
      const message = { rollId, source: SOURCE, mode: "roll", visibility: "all", ...request };
      log(`SEND ${request.mode ?? "roll"} ${request.notation} "${request.label}"`);
      OBR.broadcast.sendMessage("wayward-dice/roll-request", message, {
        destination: "LOCAL",
      });
    };
    buttons.appendChild(button);
  }
  const ready = document.createElement("button");
  ready.textContent = "Check isReady";
  ready.onclick = checkReady;
  buttons.appendChild(ready);

  checkReady();
});
