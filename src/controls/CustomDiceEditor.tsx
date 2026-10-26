import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import { styled } from "@mui/material/styles";

import { useSettingsStore } from "../settings/store";
import { contrastRatio } from "../helpers/customColors";
import { DicePreview } from "../previews/DicePreview";
import { DiceType } from "../types/DiceType";

const ColorInput = styled("input")({
  width: "44px",
  height: "28px",
  padding: 0,
  border: "none",
  background: "none",
  cursor: "pointer",
});

const SHOWN: DiceType[] = ["D4", "D6", "D8", "D10", "D12", "D20"];

/** Colours for custom dice: body, numbers, and optionally a hue per die */
export function CustomDiceEditor({ anchorEl, onClose }: { anchorEl: HTMLElement | null; onClose: () => void }) {
  const custom = useSettingsStore((state) => state.customDice);
  const setCustom = useSettingsStore((state) => state.setCustomDice);
  const hardToRead = contrastRatio(custom.base, custom.ink) < 3;

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "center", horizontal: "right" }}
      transformOrigin={{ vertical: "center", horizontal: "left" }}
    >
      <Stack width="230px" p={2} gap={1.5}>
        <Typography variant="subtitle2">Custom dice</Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" component="label" htmlFor="custom-dice-base">
            Dice
          </Typography>
          <ColorInput
            id="custom-dice-base"
            type="color"
            value={custom.base}
            onChange={(e) => setCustom({ ...custom, base: e.target.value })}
          />
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" component="label" htmlFor="custom-dice-ink">
            Numbers
          </Typography>
          <ColorInput
            id="custom-dice-ink"
            type="color"
            value={custom.ink}
            onChange={(e) => setCustom({ ...custom, ink: e.target.value })}
          />
        </Stack>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={custom.rainbow}
              onChange={(e) => setCustom({ ...custom, rainbow: e.target.checked })}
            />
          }
          label={<Typography variant="body2">Rainbow</Typography>}
        />
        <Typography variant="caption" color="text.secondary" mt={-1.5}>
          Each die in a roll gets its own colour, e.g. Daggerheart's two d12s
        </Typography>
        <Stack direction="row" justifyContent="space-between">
          {SHOWN.map((type) => (
            <DicePreview key={type} diceStyle="CUSTOM" diceType={type} size="small" />
          ))}
        </Stack>
        {hardToRead && (
          <Typography variant="caption" color="warning.main">
            The numbers may be hard to read in these colours.
          </Typography>
        )}
      </Stack>
    </Popover>
  );
}
