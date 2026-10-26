import { useState } from "react";

import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { SettingsRounded as SettingsIcon } from "@mui/icons-material";

import { useSettingsStore } from "../settings/store";
import { saveRoomSettings } from "../settings/RoomSettingsSync";

export function DiceSettings() {
  const room = useSettingsStore((state) => state.room);
  const othersRolls = useSettingsStore((state) => state.othersRolls);
  const setOthersRolls = useSettingsStore((state) => state.setOthersRolls);

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
              Other players' rolls (just you)
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
        </Stack>
      </Menu>
    </>
  );
}
