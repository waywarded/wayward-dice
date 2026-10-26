import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import { ReceiptLongRounded as HistoryIcon } from "@mui/icons-material";
import { ChevronLeftRounded as CloseIcon } from "@mui/icons-material";

import { SlideTransition } from "../controls/SlideTransition";
import { clearedHistory, HistoryEntry, loadLocalHidden, mergeHistory } from "./history";

/** The room's shared roll log, newest first; the GM can clear it */
export function RoomHistory() {
  const [open, setOpen] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [isGm, setIsGm] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    OBR.room.getMetadata().then(setMetadata);
    return OBR.room.onMetadataChange(setMetadata);
  }, []);
  useEffect(() => {
    OBR.player.getRole().then((role) => setIsGm(role === "GM"));
    return OBR.player.onChange((player) => setIsGm(player.role === "GM"));
  }, []);
  useEffect(() => {
    if (!open) {
      return;
    }
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [open]);

  const entries = mergeHistory(metadata, open ? loadLocalHidden() : []);
  const theme = useTheme();

  return (
    <>
      <Tooltip title="Roll history" placement="top" disableInteractive>
        <IconButton aria-label="Roll history" onClick={() => setOpen(true)}>
          <HistoryIcon />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullScreen
        TransitionComponent={SlideTransition}
        hideBackdrop
        PaperProps={{
          sx: {
            bgcolor:
              theme.palette.mode === "dark" ? "rgba(34, 38, 57, 0.97)" : "rgba(241, 243, 249, 0.97)",
          },
        }}
      >
        <Stack pl="60px" height="100%" position="relative">
          <IconButton
            aria-label="Close roll history"
            onClick={() => setOpen(false)}
            sx={{ position: "absolute", left: 12, top: 12, height: "calc(100% - 24px)", borderRadius: 0.5 }}
          >
            <CloseIcon />
          </IconButton>
          <Stack direction="row" alignItems="center" px={2} pt={2} pb={1}>
            <Typography variant="h6" flexGrow={1}>
              Roll history
            </Typography>
            {isGm && entries.length > 0 && (
              <Button
                size="small"
                color={confirming ? "error" : "inherit"}
                onClick={() => {
                  if (confirming) {
                    OBR.room.setMetadata(clearedHistory(metadata));
                    setConfirming(false);
                  } else {
                    setConfirming(true);
                  }
                }}
                onBlur={() => setConfirming(false)}
              >
                {confirming ? "Clear for everyone?" : "Clear"}
              </Button>
            )}
          </Stack>
          <Box component="div" px={2} pb={2} sx={{ overflowY: "auto" }}>
            {entries.length === 0 ? (
              <Typography color="text.secondary" variant="body2" mt={2}>
                No rolls yet. Rolls from everyone in the room show here.
              </Typography>
            ) : (
              <Stack gap={1}>
                {entries.map((entry) => (
                  <HistoryRow key={entry.i} entry={entry} now={now} />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Dialog>
    </>
  );
}

function HistoryRow({ entry, now }: { entry: HistoryEntry; now: number }) {
  const hiddenFromMe = entry.h && entry.r === undefined;
  return (
    <Box component="div" sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Box
          component="span"
          sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: entry.c ?? "text.secondary", flexShrink: 0 }}
        />
        <Typography variant="caption" color="text.secondary" noWrap flexGrow={1}>
          {entry.p} · {timeAgo(entry.t * 1000, now)}
          {entry.h ? " · hidden" : ""}
        </Typography>
      </Stack>
      {hiddenFromMe ? (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          Hidden roll
        </Typography>
      ) : (
        <>
          <Stack direction="row" alignItems="baseline" gap={1}>
            <Typography variant="body2" noWrap flexGrow={1} title={entry.l ?? entry.n}>
              {entry.l ?? entry.n}
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ flexShrink: 0 }}>
              {entry.r}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {entry.l ? `${entry.n} · ` : ""}
            {entry.v?.split(",").join(" ")}
          </Typography>
        </>
      )}
    </Box>
  );
}

function timeAgo(then: number, now: number) {
  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  return new Date(then).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
