import OBR from "@owlbear-rodeo/sdk";
import { useEffect } from "react";
import { parseRoomSettings, ROOM_SETTINGS_KEY, RoomSettings, useSettingsStore } from "./store";

/** Keeps the settings store in step with the room's metadata (inside PluginGate) */
export function RoomSettingsSync() {
  useEffect(() => {
    const apply = (metadata: Record<string, unknown>) =>
      useSettingsStore.getState().setRoom(parseRoomSettings(metadata[ROOM_SETTINGS_KEY]));
    OBR.room.getMetadata().then(apply);
    return OBR.room.onMetadataChange(apply);
  }, []);
  useEffect(() => {
    OBR.player.getRole().then((role) => useSettingsStore.setState({ isGm: role === "GM" }));
    return OBR.player.onChange((player) => useSettingsStore.setState({ isGm: player.role === "GM" }));
  }, []);
  return null;
}

export function saveRoomSettings(room: RoomSettings) {
  useSettingsStore.getState().setRoom(room);
  if (OBR.isAvailable) {
    OBR.room.setMetadata({ [ROOM_SETTINGS_KEY]: room });
  }
}
