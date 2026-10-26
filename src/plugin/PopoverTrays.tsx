import OBR, { Player } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

import Box from "@mui/material/Box";

import { PopoverTray } from "./PopoverTray";
import { getPluginId } from "./getPluginId";
import { SelfPopoverTray } from "./SelfPopoverTray";
import { useSettingsStore } from "../settings/store";

export function PopoverTrays() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    OBR.party.getPlayers().then(setPlayers);
  }, []);
  useEffect(() => OBR.party.onChange(setPlayers), []);

  const [name, setName] = useState("");
  useEffect(() => {
    OBR.player.getName().then(setName);
    return OBR.player.onChange((player) => setName(player.name));
  }, []);

  const [visibleTrays, setVisibleTrays] = useState<string[]>([]);

  useEffect(() => {
    const playerIds = players.map((p) => p.connectionId);
    setVisibleTrays((visible) =>
      visible.filter((id) => id === "self" || playerIds.includes(id))
    );
  }, [players]);

  function handleTrayToggle(connectionId: string, shown: boolean) {
    if (shown) {
      setVisibleTrays((visible) =>
        visible.includes(connectionId) ? visible : [...visible, connectionId]
      );
    } else {
      setVisibleTrays((visible) => visible.filter((id) => id !== connectionId));
    }
  }

  function handleTrayOpen(connectionId: string) {
    if (window.BroadcastChannel) {
      OBR.action.open();
      const channel = new BroadcastChannel(getPluginId("focused-tray"));
      channel.postMessage(connectionId);
      channel.close();
    }
  }

  // Hide popover when no trays are visible, and keep it small for results only
  const othersRolls = useSettingsStore((state) => state.othersRolls);
  const size =
    visibleTrays.length === 0
      ? "NONE"
      : othersRolls === "RESULT" && !visibleTrays.includes("self")
        ? "RESULT"
        : "TRAY";
  useEffect(() => {
    if (size === "NONE") {
      OBR.popover.setHeight(getPluginId("popover"), 0);
      OBR.popover.setWidth(getPluginId("popover"), 0);
    } else {
      // Height = Tray (or result line) + Name + Bottom
      OBR.popover.setHeight(getPluginId("popover"), size === "RESULT" ? 56 : 298);
      // Width = Tray + Right
      OBR.popover.setWidth(getPluginId("popover"), 266);
    }
  }, [size]);

  return (
    <Box
      component="div"
      position="absolute"
      bottom="0"
      left="0"
      right="0"
      top="0"
      overflow="hidden"
    >
      <SelfPopoverTray
        name={name}
        onToggle={handleTrayToggle}
        onOpen={() => OBR.action.open()}
      />
      {players.map((player) => (
        <PopoverTray
          key={player.connectionId}
          player={player}
          onToggle={handleTrayToggle}
          onOpen={handleTrayOpen}
        />
      ))}
    </Box>
  );
}
