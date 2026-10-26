import type * as THREE from "three";
import React from "react";
import { Die } from "../types/Die";

import { DiceMesh } from "../meshes/DiceMesh";
import { DiceMaterial } from "../materials/DiceMaterial";
import { useSettingsStore } from "../settings/store";

type DiceProps = JSX.IntrinsicElements["group"] & { die: Die };

export const Dice = React.forwardRef<THREE.Group, DiceProps>(
  ({ die, children, ...props }, ref) => {
    // A custom die without colours (the picker's preview) shows the player's own
    const custom = useSettingsStore((state) => state.customDice);
    return (
      <DiceMesh
        diceType={die.type}
        {...props}
        ref={ref}
      >
        <DiceMaterial diceStyle={die.style} colors={die.colors ?? custom} />
        {children}
      </DiceMesh>
    );
  }
);
