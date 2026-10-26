import { useState } from "react";

import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import { SettingsRounded as SettingsIcon } from "@mui/icons-material";

import { useSettingsStore } from "../settings/store";
import { saveRoomSettings } from "../settings/RoomSettingsSync";
import { useDiceControlsStore } from "./store";

export function DiceSettings() {
  const room = useSettingsStore((state) => state.room);
  const othersRolls = useSettingsStore((state) => state.othersRolls);
  const setOthersRolls = useSettingsStore((state) => state.setOthersRolls);
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
          </Stack>
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
