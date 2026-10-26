import { DiceSet } from "../types/DiceSet";
import { DiceStyle } from "../types/DiceStyle";
import { Die } from "../types/Die";

import * as galaxyPreviews from "../previews/galaxy";
import * as gemstonePreviews from "../previews/gemstone";
import * as glassPreviews from "../previews/glass";
import * as ironPreviews from "../previews/iron";
import * as nebulaPreviews from "../previews/nebula";
import * as sunrisePreviews from "../previews/sunrise";
import * as dragonbanePreviews from "../previews/dragonbane";
import * as vaesenPreviews from "../previews/vaesen";

import allPreview from "../previews/all.png";

const standardPreviews: Record<DiceStyle, string> = {
  GALAXY: galaxyPreviews.D20,
  GEMSTONE: gemstonePreviews.D20,
  GLASS: glassPreviews.D20,
  IRON: ironPreviews.D20,
  NEBULA: nebulaPreviews.D20,
  SUNRISE: sunrisePreviews.D20,
  DRAGONBANE: dragonbanePreviews.D20,
  VAESEN: vaesenPreviews.D6,
};

function createStandardSet(style: DiceStyle): DiceSet {
  const id = `${style}_STANDARD`;
  return {
    id,
    name: `${style.toLowerCase()} dice`,
    dice: [
      { id: `${id}_D4`, type: "D4", style },
      { id: `${id}_D6`, type: "D6", style },
      { id: `${id}_D8`, type: "D8", style },
      { id: `${id}_D10`, type: "D10", style },
      { id: `${id}_D12`, type: "D12", style },
      { id: `${id}_D20`, type: "D20", style },
      { id: `${id}_D100`, type: "D100", style },
    ],
    previewImage: standardPreviews[style],
  };
}

const standardSets = [
  createStandardSet("GALAXY"),
  createStandardSet("GEMSTONE"),
  createStandardSet("GLASS"),
  createStandardSet("IRON"),
  createStandardSet("NEBULA"),
  createStandardSet("SUNRISE"),
  createStandardSet("DRAGONBANE"),
  createStandardSet("VAESEN"),
];

const allSet: DiceSet = {
  id: "all",
  name: "all",
  dice: standardSets.reduce(
    (prev, curr) => [...prev, ...curr.dice],
    [] as Die[]
  ),
  previewImage: allPreview,
};

export const diceSets: DiceSet[] = [...standardSets, allSet];
