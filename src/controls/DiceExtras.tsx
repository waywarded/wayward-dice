import { useState } from "react";

import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import Tooltip from "@mui/material/Tooltip";

import { DieBonus } from "./DieBonus";
import { DieAdvantage } from "./DieAdvantage";
import { DieCount } from "./DieCount";
import { useDiceControlsStore } from "./store";
import { useDiceRollStore } from "../dice/store";
import { useSettingsStore } from "../settings/store";

/** "+/-" under the Roll arrow: bonus, keep highest/lowest and counting, for the roll being picked */
export function DiceExtras() {
  const bonus = useDiceControlsStore((state) => state.diceBonus);
  const setBonus = useDiceControlsStore((state) => state.setDiceBonus);
  const advantage = useDiceControlsStore((state) => state.diceAdvantage);
  const setAdvantage = useDiceControlsStore((state) => state.setDiceAdvantage);
  const advantageCount = useDiceControlsStore((state) => state.diceAdvantageCount);
  const setAdvantageCount = useDiceControlsStore((state) => state.setDiceAdvantageCount);
  const room = useSettingsStore((state) => state.room);
  const diceCount = useDiceControlsStore((state) => state.diceCount);
  const setDiceCount = useDiceControlsStore((state) => state.setDiceCount);

  const clearRoll = useDiceRollStore((state) => state.clearRoll);
  const roll = useDiceRollStore((state) => state.roll);
  function clearRollIfNeeded() {
    if (roll) {
      clearRoll();
    }
  }

  /** Controls (bonus and adv/dis) */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget);
  }
  function handleClose() {
    setAnchorEl(null);
  }

  return (
    <>
      <Tooltip
        title={room.keepNames === "BOON" ? "Bonus, boons, count" : "Bonus, advantage, count"}
        // Below, so it never covers the Roll arrow above
        placement="bottom"
        disableInteractive
      >
        <Button
          aria-label="Bonus and modifiers"
          id="more-button"
          aria-controls={open ? "more-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          variant="contained"
          color="inherit"
          size="small"
          sx={{
            minWidth: 0,
            px: 1.5,
            borderRadius: "16px",
            fontSize: "15px",
            lineHeight: "22px",
            bgcolor: "background.paper",
            color: "text.primary",
            ":hover": { bgcolor: "background.default" },
          }}
        >
          +/-
        </Button>
      </Tooltip>
      <Menu
        id="more-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "more-button",
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Stack>
          {/* A count of successes has no bonus */}
          {!diceCount && (
          <DieBonus
            bonus={bonus}
            onChange={(bonus) => {
              setBonus(bonus);
              clearRollIfNeeded();
            }}
            onIncrease={() => {
              setBonus(bonus + 1);
              clearRollIfNeeded();
            }}
            onDecrease={() => {
              setBonus(bonus - 1);
              clearRollIfNeeded();
            }}
          />
          )}
          {!diceCount && <Divider variant="middle" />}
          <DieAdvantage
            advantage={advantage}
            count={advantageCount}
            names={room.keepNames}
            onChange={(advantage) => {
              setAdvantage(advantage);
              clearRollIfNeeded();
            }}
            onCountChange={(count) => {
              setAdvantageCount(count);
              clearRollIfNeeded();
            }}
          />
          <Divider variant="middle" />
          <DieCount
            count={diceCount}
            onChange={(count) => {
              setDiceCount(count);
              clearRollIfNeeded();
            }}
          />
        </Stack>
      </Menu>
    </>
  );
}
