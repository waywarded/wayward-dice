import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import Typography from "@mui/material/Typography";

import { AddCircleOutlineRounded as IncreaseIcon } from "@mui/icons-material";
import { RemoveCircleOutlineRounded as DecreaseIcon } from "@mui/icons-material";

import { CountRule } from "../types/Dice";

const OPS: { value: CountRule["op"]; label: string }[] = [
  { value: ">=", label: "≥" },
  { value: "=", label: "=" },
  { value: "<=", label: "≤" },
  { value: "<", label: "<" },
  { value: ">", label: ">" },
];

/** Count the dice that meet a rule (e.g. Vaesen: each 6 is a success) instead of adding them up */
export function DieCount({
  count,
  onChange,
}: {
  count: CountRule | null;
  onChange: (count: CountRule | null) => void;
}) {
  return (
    <Stack direction="row" alignItems="center" gap={1} px={1} py={1}>
      <ToggleButton
        value="count"
        size="small"
        selected={count !== null}
        onChange={() => onChange(count ? null : { op: ">=", target: 6 })}
        sx={{ flexShrink: 0 }}
      >
        Count
      </ToggleButton>
      {count ? (
        <>
          <Select
            size="small"
            variant="standard"
            disableUnderline
            value={count.op}
            onChange={(e) => onChange({ ...count, op: e.target.value as CountRule["op"] })}
            aria-label="Successes are faces"
          >
            {OPS.map((op) => (
              <MenuItem key={op.value} value={op.value}>
                {op.label}
              </MenuItem>
            ))}
          </Select>
          <IconButton
            aria-label="lower target"
            disabled={count.target <= 1}
            onClick={() => onChange({ ...count, target: count.target - 1 })}
          >
            <DecreaseIcon />
          </IconButton>
          <Typography minWidth="24px" textAlign="center">
            {count.target}
          </Typography>
          <IconButton
            aria-label="raise target"
            disabled={count.target >= 100}
            onClick={() => onChange({ ...count, target: count.target + 1 })}
          >
            <IncreaseIcon />
          </IconButton>
        </>
      ) : (
        <Typography variant="caption" color="text.secondary">
          successes instead of a total
        </Typography>
      )}
    </Stack>
  );
}
