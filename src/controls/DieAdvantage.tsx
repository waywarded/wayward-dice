import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import { AddCircleOutlineRounded as IncreaseIcon } from "@mui/icons-material";
import { RemoveCircleOutlineRounded as DecreaseIcon } from "@mui/icons-material";

import { Advantage, MAX_ADVANTAGE_COUNT } from "./store";
import { keepLabel, keepOptions, KeepNames } from "../settings/store";

type DieAdvantageProps = {
  advantage: Advantage;
  count: number;
  names: KeepNames;
  onChange: (advantage: Advantage) => void;
  onCountChange: (count: number) => void;
};

/**
 * Keep the highest or lowest die. The count is how many extra dice are rolled
 * per die, e.g. two boons on a d20 roll three and keep the lowest.
 */
export function DieAdvantage({
  advantage,
  count,
  names,
  onChange,
  onCountChange,
}: DieAdvantageProps) {
  const options = keepOptions(names);
  return (
    <Stack>
      <ToggleButtonGroup
        color="primary"
        value={advantage}
        exclusive
        onChange={(_, value) => {
          onChange(value);
        }}
        aria-label={names === "BOON" ? "Boon / Bane" : "Advantage / Disadvantage"}
        fullWidth
        sx={{
          borderRadius: 0,
          py: 1,
          ".MuiToggleButton-root": { borderRadius: 0 },
        }}
      >
        <ToggleButton
          value={options[0].value}
          sx={{ borderWidth: 0, borderRightWidth: 1 }}
        >
          {options[0].label}
        </ToggleButton>
        <ToggleButton value={options[1].value} sx={{ border: 0 }}>
          {options[1].label}
        </ToggleButton>
      </ToggleButtonGroup>
      {advantage !== null && (
        <Stack direction="row" alignItems="center" justifyContent="center" gap={1}>
          <IconButton
            aria-label="fewer extra dice"
            disabled={count <= 1}
            onClick={() => onCountChange(count - 1)}
          >
            <DecreaseIcon />
          </IconButton>
          <Typography minWidth="72px" textAlign="center">
            {keepLabel(advantage, count, names)}
          </Typography>
          <IconButton
            aria-label="more extra dice"
            disabled={count >= MAX_ADVANTAGE_COUNT}
            onClick={() => onCountChange(count + 1)}
          >
            <IncreaseIcon />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
}
