import { DiceStyle } from "../types/DiceStyle";
import { GalaxyMaterial } from "./galaxy/GalaxyMaterial";
import { GemstoneMaterial } from "./gemstone/GemstoneMaterial";
import { GlassMaterial } from "./glass/GlassMaterial";
import { IronMaterial } from "./iron/IronMaterial";
import { NebulaMaterial } from "./nebula/NebulaMaterial";
import { SunriseMaterial } from "./sunrise/SunriseMaterial";
import { DragonbaneMaterial } from "./dragonbane/DragonbaneMaterial";
import { VaesenMaterial } from "./vaesen/VaesenMaterial";

export function DiceMaterial({ diceStyle }: { diceStyle: DiceStyle }) {
  switch (diceStyle) {
    case "GALAXY":
      return <GalaxyMaterial />;
    case "GEMSTONE":
      return <GemstoneMaterial />;
    case "GLASS":
      return <GlassMaterial />;
    case "IRON":
      return <IronMaterial />;
    case "NEBULA":
      return <NebulaMaterial />;
    case "SUNRISE":
      return <SunriseMaterial />;
    case "DRAGONBANE":
      return <DragonbaneMaterial />;
    case "VAESEN":
      return <VaesenMaterial />;
    default:
      throw Error(`Dice style ${diceStyle} error: not implemented`);
  }
}
