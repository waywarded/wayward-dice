import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Slide from "@mui/material/Slide";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import ButtonBase from "@mui/material/ButtonBase";

import environment from "../environment.hdr";
import { AudioListenerProvider } from "../audio/AudioListenerProvider";
import { Tray } from "../tray/Tray";
import { TraySuspense } from "../tray/TraySuspense";
import { AnimatedPlayerCamera } from "./AnimatedPlayerCamera";
import { InteractiveDiceRoll } from "../dice/InteractiveDiceRoll";
import { useDiceRollStore } from "../dice/store";
import { getCombinedDiceValue } from "../helpers/getCombinedDiceValue";
import { DiceTransform } from "../types/DiceTransform";
import { POPOVER_DPR } from "./popoverDpr";

/**
 * The player's own tray in the background popover: rolls requested while the
 * dice panel is closed are simulated here, from the same dice roll store and
 * physics the panel uses. Laid out like the other players' trays.
 */
export function SelfPopoverTray({
  name,
  onToggle,
  onOpen,
}: {
  name: string;
  onToggle: (id: string, show: boolean) => void;
  onOpen: () => void;
}) {
  const roll = useDiceRollStore((state) => state.roll);
  const rollValues = useDiceRollStore((state) => state.rollValues);
  const rollTransforms = useDiceRollStore((state) => state.rollTransforms);

  const finishedRolling = useMemo(() => {
    const values = Object.values(rollValues);
    return values.length > 0 && values.every((value) => value !== null);
  }, [rollValues]);

  const finalValue = useMemo(
    () =>
      roll && finishedRolling
        ? getCombinedDiceValue(roll, rollValues as Record<string, number>)
        : null,
    [roll, rollValues, finishedRolling]
  );

  const theme = useTheme();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (finishedRolling) {
      const timeout = setTimeout(() => setTimedOut(true), 5000);
      return () => clearTimeout(timeout);
    } else {
      setTimedOut(false);
    }
  }, [finishedRolling]);

  const shown = !!roll && !timedOut;
  useEffect(() => {
    if (shown) {
      onToggle("self", true);
    }
  }, [shown]);

  const label = roll?.request?.label;

  return (
    <Box component="div" position="absolute" right={16} bottom={16}>
      {/* Mounted only while showing, so an idle popover holds no WebGL context */}
      <Slide
        in={shown}
        onExited={() => onToggle("self", false)}
        direction="up"
        mountOnEnter
        unmountOnExit
      >
        <ButtonBase
          onClick={() => {
            setTimedOut(true);
            onOpen();
          }}
        >
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
                    <InteractiveDiceRoll />
                    <AnimatedPlayerCamera
                      rollTransforms={
                        finishedRolling
                          ? (rollTransforms as Record<string, DiceTransform>)
                          : undefined
                      }
                    />
                  </AudioListenerProvider>
                </Canvas>
              </TraySuspense>
            </Box>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              textAlign="center"
              lineHeight="32px"
              sx={{ bgcolor: "background.default" }}
              noWrap
            >
              {label ?? name}
              {finishedRolling && <span> | {finalValue}</span>}
            </Typography>
          </Paper>
        </ButtonBase>
      </Slide>
    </Box>
  );
}
