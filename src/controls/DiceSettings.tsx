import { useState } from "react";

import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";

import { SettingsRounded as SettingsIcon } from "@mui/icons-material";

import { useSettingsStore } from "../settings/store";
import { saveRoomSettings } from "../settings/RoomSettingsSync";
import { useDiceControlsStore } from "./store";

export function DiceSettings() {
  const room = useSettingsStore((state) => state.room);
  const isGm = useSettingsStore((state) => state.isGm);
  const othersRolls = useSettingsStore((state) => state.othersRolls);
  const setOthersRolls = useSettingsStore((state) => state.setOthersRolls);
  const feltColor = useSettingsStore((state) => state.feltColor);
  const setFeltColor = useSettingsStore((state) => state.setFeltColor);
  const autoOpen = useSettingsStore((state) => state.autoOpen);
  const setAutoOpen = useSettingsStore((state) => state.setAutoOpen);
  const toggleFairnessTester = useDiceControlsStore((state) => state.toggleFairnessTester);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Settings" placement="top" disableInteractive>
        <IconButton
          id="settings-button"
          aria-controls={open ? "settings-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="settings-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{ "aria-labelledby": "settings-button" }}
        anchorOrigin={{ vertical: "center", horizontal: "right" }}
        transformOrigin={{ vertical: "center", horizontal: "left" }}
      >
        <Stack width="240px" px={2} py={1} gap={2}>
          <Stack gap={0.5}>
            <Typography variant="caption" color="text.secondary">
              Keep highest / lowest is called (whole room)
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={room.keepNames}
              exclusive
              fullWidth
              onChange={(_, keepNames) => keepNames && saveRoomSettings({ ...room, keepNames })}
            >
              <ToggleButton value="ADVANTAGE">Adv / Dis</ToggleButton>
              <ToggleButton value="BOON">Boon / Bane</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary">
              {room.keepNames === "BOON"
                ? "Roll-under: a natural 1 on a d20 is a crit, 20 a fumble"
                : "Roll-over: a natural 20 on a d20 is a crit, 1 a fumble"}
            </Typography>
          </Stack>
          {isGm && (
            <Stack gap={0.5}>
              <Typography variant="caption" color="text.secondary">
                Pushes (whole room, GM only)
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={room.pushes ? "ON" : "OFF"}
                exclusive
                fullWidth
                onChange={(_, value) => value && saveRoomSettings({ ...room, pushes: value === "ON" })}
              >
                <ToggleButton value="OFF">Off</ToggleButton>
                <ToggleButton value="ON">On</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary">
                Push re-rolls what failed, once: a pool's misses, or a failed roll against a target
              </Typography>
            </Stack>
          )}
          <Stack gap={0.5}>
            <Typography variant="caption" color="text.secondary">
              Auto-open dice panel (just you)
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={autoOpen}
              exclusive
              fullWidth
              onChange={(_, value) => value && setAutoOpen(value)}
            >
              <ToggleButton value="NEVER">Never</ToggleButton>
              <ToggleButton value="MINE">My rolls</ToggleButton>
              <ToggleButton value="ALL">All rolls</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Stack gap={0.5}>
            <Typography variant="caption" color="text.secondary">
              Other players' rolls in the corner (just you)
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={othersRolls}
              exclusive
              fullWidth
              onChange={(_, value) => value && setOthersRolls(value)}
            >
              <ToggleButton value="TRAY">3D tray</ToggleButton>
              <ToggleButton value="RESULT">Result only</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Stack gap={0.5}>
            <Typography variant="caption" color="text.secondary">
              Tray felt (just you)
            </Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              {FELTS.map((felt) => (
                <Tooltip key={felt.name} title={felt.name} disableInteractive>
                  <Box
                    component="button"
                    aria-label={`${felt.name} felt`}
                    aria-pressed={feltColor === felt.color}
                    onClick={() => setFeltColor(felt.color)}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: 2,
                      borderColor: feltColor === felt.color ? "primary.main" : "divider",
                      bgcolor: felt.color ?? "#2a150b",
                      cursor: "pointer",
                      p: 0,
                    }}
                  />
                </Tooltip>
              ))}
              <Tooltip title="Any colour" disableInteractive>
                <Box
                  component="input"
                  type="color"
                  aria-label="Felt colour"
                  value={feltColor ?? "#2a150b"}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFeltColor(e.target.value)}
                  sx={{ width: 32, height: 26, p: 0, border: "none", background: "none", cursor: "pointer" }}
                />
              </Tooltip>
            </Stack>
          </Stack>
          <Link
            component="button"
            variant="caption"
            color="text.secondary"
            alignSelf="flex-start"
            onClick={() => {
              setAnchorEl(null);
              toggleFairnessTester();
            }}
          >
            Fairness tester…
          </Link>
        </Stack>
      </Menu>
    </>
  );
}

/** Felt presets: the original brown, then classic table colours */
const FELTS: { name: string; color: string | null }[] = [
  { name: "Original", color: null },
  { name: "Green", color: "#1f5a32" },
  { name: "Blue", color: "#1f3b6b" },
  { name: "Red", color: "#6b1f24" },
  { name: "Black", color: "#141414" },
];
