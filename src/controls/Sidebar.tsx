import SimpleBar from "simplebar-react";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

import { DiceSetPicker } from "./DiceSetPicker";
import { DicePicker } from "./DicePicker";
import { DiceHidden } from "./DiceHidden";
import { RoomHistory } from "../history/RoomHistory";
import { DiceSettings } from "./DiceSettings";

import { PluginGate } from "../plugin/PluginGate";
import { DiceRollSync } from "../plugin/DiceRollSync";
import { PartyTrays } from "../plugin/PartyTrays";
import { ResizeObserver as PluginResizeObserver } from "../plugin/ResizeObserver";
import { PanelApiBridge } from "../api/PanelApiBridge";
import { RollResultReporter } from "../api/RollResultReporter";
import { HistoryRecorder } from "../history/HistoryRecorder";
import { RoomSettingsSync } from "../settings/RoomSettingsSync";

export function Sidebar() {
  return (
    <SimpleBar
      style={{
        maxHeight: "100vh",
        width: "60px",
        minWidth: "60px",
        overflowY: "auto",
      }}
    >
      <Stack p={1} gap={1} alignItems="center">
        <DicePicker />
        <Divider flexItem sx={{ mx: 1 }} />
        <DiceSetPicker />
        <DiceHidden />
        <PluginGate>
          <RoomHistory />
        </PluginGate>
        <DiceSettings />
        <PluginGate>
          <Divider flexItem sx={{ mx: 1 }} />
          <DiceRollSync />
          <PanelApiBridge />
          <RoomSettingsSync />
          <RollResultReporter />
          <HistoryRecorder />
          <PartyTrays />
          <PluginResizeObserver />
        </PluginGate>
      </Stack>
    </SimpleBar>
  );
}
