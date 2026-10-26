import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

/** "Hilda: Swords | 12": a long label is cut short, never the result */
export function TrayCaption({
  label,
  result,
  lineHeight = "32px",
}: {
  label?: string;
  result: string | null;
  lineHeight?: string;
}) {
  return (
    <Stack
      direction="row"
      justifyContent="center"
      px={1}
      sx={{ bgcolor: "background.default" }}
    >
      <Typography variant="subtitle1" color="text.secondary" lineHeight={lineHeight} noWrap>
        {label}
      </Typography>
      {result !== null && (
        <Typography
          variant="subtitle1"
          color="text.secondary"
          lineHeight={lineHeight}
          sx={{ flexShrink: 0, whiteSpace: "pre" }}
        >
          {` | ${result}`}
        </Typography>
      )}
    </Stack>
  );
}
