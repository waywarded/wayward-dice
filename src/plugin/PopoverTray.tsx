import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Player } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { hasStagedRequest } from "../api/RollRequestListener";
import { focusPlayerTray } from "./focusPlayerTray";

import Box from "@mui/material/Box";
import Slide from "@mui/material/Slide";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import ButtonBase from "@mui/material/ButtonBase";

import environment from "../environment.hdr";
import { usePlayerDice } from "./usePlayerDice";
import { PlayerDiceRoll } from "./PlayerDiceRoll";
import { AudioListenerProvider } from "../audio/AudioListenerProvider";
import { Tray } from "../tray/Tray";
import { TraySuspense } from "../tray/TraySuspense";
import { AnimatedPlayerCamera } from "./AnimatedPlayerCamera";
import { POPOVER_DPR } from "./popoverDpr";
import { TrayCaption } from "./TrayCaption";
import { useSettingsStore } from "../settings/store";

export function PopoverTray({
  player,
  onToggle,
  onOpen,
}: {
  player: Player;
  onToggle: (connectionId: string, show: boolean) => void;
  onOpen: (connectionId: string) => void;
}) {
  const { diceRoll, summary, finishedRolling, finishedRollTransforms } =
    usePlayerDice(player);

  const theme = useTheme();
  const othersRolls = useSettingsStore((state) => state.othersRolls);
  const caption = diceRoll?.request?.label ?? player?.name;

  const hidden = !diceRoll || diceRoll.hidden;

  const [timedOut, setTimedOut] = useState(finishedRolling);

  useEffect(() => {
    if (finishedRolling) {
      const timeout = setTimeout(() => {
        setTimedOut(true);
      }, 5000);
      return () => {
        clearTimeout(timeout);
      };
    } else {
      setTimedOut(false);
    }
  }, [finishedRolling]);

  // "All rolls": watch it roll in the dice panel instead of the corner
  const autoOpen = useSettingsStore((state) => state.autoOpen);
  const rollKey = diceRoll ? getDieFromDice(diceRoll).map((die) => die.id).join() : "";
  const [openedKey, setOpenedKey] = useState("");
  const openInPanel =
    autoOpen === "ALL" && !hidden && !finishedRolling && !hasStagedRequest();
  useEffect(() => {
    if (openInPanel && openedKey !== rollKey) {
      setOpenedKey(rollKey);
      focusPlayerTray(player.connectionId);
    }
  }, [openInPanel, rollKey]);

  const shown = !hidden && !timedOut && !(openInPanel || openedKey === rollKey);
  useEffect(() => {
    if (shown) {
      onToggle(player.connectionId, true);
    }
  }, [shown]);

  function handleClick() {
    if (shown) {
      setTimedOut(true);
      onOpen(player.connectionId);
    }
  }

  return (
    <Box component="div" position="absolute" right={16} bottom={16}>
      {/* Mounted only while showing, so idle players hold no WebGL context */}
      <Slide
        in={shown}
        onExited={() => onToggle(player.connectionId, false)}
        direction="up"
        mountOnEnter
        unmountOnExit
      >
        {othersRolls === "RESULT" ? (
          <ButtonBase onClick={handleClick}>
            <Paper
              elevation={8}
              sx={{
                width: "250px",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "background.default",
              }}
            >
              <TrayCaption
                label={caption}
                result={finishedRolling ? summary : "…"}
                lineHeight="40px"
              />
            </Paper>
          </ButtonBase>
        ) : (
        <ButtonBase onClick={handleClick}>
          <Paper
            elevation={8}
            sx={{
              width: "250px",
              height: "282px",
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(34, 38, 57, 0.8)"
                  : "rgba(255, 255, 255, 0.4)",
            }}
          >
            <Box component="div" height="250px" width="250px">
              <TraySuspense>
                <Canvas frameloop="demand" dpr={POPOVER_DPR}>
                  <AudioListenerProvider volume={0.25}>
                    <Environment files={environment} />
                    <Tray />
                    <PlayerDiceRoll player={player} />
                    <AnimatedPlayerCamera
                      rollTransforms={
                        finishedRolling ? finishedRollTransforms : undefined
                      }
                    />
                  </AudioListenerProvider>
                </Canvas>
              </TraySuspense>
            </Box>
            <TrayCaption label={caption} result={finishedRolling ? summary : null} />
          </Paper>
        </ButtonBase>
        )}
      </Slide>
    </Box>
  );
}
