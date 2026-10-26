import { useState } from "react";

import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import { styled } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";

import { DiceBagIcon } from "../icons/DiceBagIcon";

import { diceSets } from "../sets/diceSets";
import { useDiceControlsStore } from "./store";
import { CustomDiceEditor } from "./CustomDiceEditor";
import { useCustomPreview } from "../previews/customPreview";

const PreviewImage = styled("img")({
  width: "32px",
  height: "32px",
});

export function DiceSetPicker() {
  const diceSet = useDiceControlsStore((state) => state.diceSet);
  const changeDiceSet = useDiceControlsStore((state) => state.changeDiceSet);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  // Choosing Custom opens its colours, next to the bag
  const [editorAnchor, setEditorAnchor] = useState<null | HTMLElement>(null);
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget);
  }
  function handleClose() {
    setAnchorEl(null);
  }

  return (
    <>
      {/* A bag, not a die: the column above already shows the chosen set's dice */}
      <Tooltip title="Dice set" placement="top" disableInteractive>
        <IconButton
          aria-label="change dice set"
          id="dice-set-button"
          aria-controls={open ? "dice-set-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
        >
          <DiceBagIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="dice-set-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "dice-set-button",
        }}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "left",
        }}
        marginThreshold={0}
      >
        <Stack gap={1} alignItems="center" p="2px">
          {diceSets.map((set) => (
            <Tooltip key={set.id} title={setTitle(set.name)} placement="right" disableInteractive>
            <IconButton
              aria-label={set.name}
              onClick={() => {
                changeDiceSet(set);
                if (set.id === "CUSTOM_STANDARD") {
                  setEditorAnchor(anchorEl);
                }
                handleClose();
              }}
              sx={{
                padding: "2px",
                backgroundColor:
                  diceSet.id === set.id
                    ? "rgba(255, 255, 255, 0.16) !important"
                    : undefined,
              }}
            >
              {set.id === "CUSTOM_STANDARD" ? (
                <CustomSetPreview />
              ) : (
                <PreviewImage src={set.previewImage} />
              )}
            </IconButton>
            </Tooltip>
          ))}
        </Stack>
      </Menu>
      <CustomDiceEditor anchorEl={editorAnchor} onClose={() => setEditorAnchor(null)} />
    </>
  );
}

/** "vaesen dice" → "Vaesen"; "all" → "All styles" */
function setTitle(name: string) {
  const title = name.replace(/ dice$/, "");
  return title === "all" ? "All styles" : title.charAt(0).toUpperCase() + title.slice(1);
}

function CustomSetPreview() {
  const src = useCustomPreview("D20");
  return <PreviewImage src={src || undefined} alt="" />;
}
