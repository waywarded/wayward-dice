import * as THREE from "three";
import { useTexture } from "@react-three/drei";

import albedo from "./albedo.jpg";
import normal from "./normal.jpg";
import mask from "./mask.png";
import { gltfTexture } from "../../helpers/gltfTexture";

const attenuationColor = new THREE.Color(0.1, 0.7, 0.3);

/**
 * Translucent green with white numbers; the d20 shows the Dragon on its 1 and
 * the Demon on its 20 (scripts/dice-textures). Lit like Glass.
 */
export function DragonbaneMaterial(
  props: JSX.IntrinsicElements["meshPhysicalMaterial"]
) {
  const [albedoMap, maskMap, normalMap] = useTexture(
    [albedo, mask, normal],
    (textures) => gltfTexture(textures, ["SRGB", "LINEAR", "LINEAR"])
  );

  return (
    <meshPhysicalMaterial
      map={albedoMap}
      roughness={0.25}
      metalness={0}
      normalMap={normalMap}
      transmission={1}
      transmissionMap={maskMap}
      thickness={1.5}
      envMapIntensity={1}
      attenuationColor={attenuationColor}
      attenuationDistance={0.3}
      {...props}
    />
  );
}
