import { styled } from "@mui/material/styles";

import { DiceStyle } from "../types/DiceStyle";
import { DiceType } from "../types/DiceType";
import { useCustomPreview } from "./customPreview";

import * as galaxyPreviews from "./galaxy";
import * as gemstonePreviews from "./gemstone";
import * as glassPreviews from "./glass";
import * as ironPreviews from "./iron";
import * as nebulaPreviews from "./nebula";
import * as sunrisePreviews from "./sunrise";
import * as dragonbanePreviews from "./dragonbane";
import * as vaesenPreviews from "./vaesen";

const previews: Record<Exclude<DiceStyle, "CUSTOM">, Record<DiceType, string>> = {
  GALAXY: galaxyPreviews,
  GEMSTONE: gemstonePreviews,
  GLASS: glassPreviews,
  IRON: ironPreviews,
  NEBULA: nebulaPreviews,
  SUNRISE: sunrisePreviews,
  DRAGONBANE: dragonbanePreviews,
  VAESEN: vaesenPreviews,
};

interface PreviewImageProps {
  size?: "small" | "medium" | "large";
}

const PreviewImage = styled("img", {
  shouldForwardProp: (prop) => prop !== "size",
})<PreviewImageProps>(({ size }) => ({
  width: size === "small" ? "28px" : size === "medium" ? "34px" : "38px",
  height: size === "small" ? "28px" : size === "medium" ? "34px" : "38px",
}));

type DiePreviewProps = {
  diceType: DiceType;
  diceStyle: DiceStyle;
  size?: "small" | "medium" | "large";
};

export function DicePreview({ diceType, diceStyle, size }: DiePreviewProps) {
  if (diceStyle === "CUSTOM") {
    return <CustomDicePreview diceType={diceType} size={size} />;
  }
  return (
    <PreviewImage
      src={previews[diceStyle][diceType]}
      alt={`${diceStyle} ${diceType} preview`}
      size={size}
    />
  );
}

/** Custom dice are drawn in the player's colours, so their previews are made on the fly */
function CustomDicePreview({ diceType, size }: { diceType: DiceType; size?: DiePreviewProps["size"] }) {
  const src = useCustomPreview(diceType);
  return <PreviewImage src={src || undefined} alt={`CUSTOM ${diceType} preview`} size={size} />;
}
