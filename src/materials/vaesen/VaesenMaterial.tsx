import { useTexture } from "@react-three/drei";

import albedo from "./albedo.jpg";
import orm from "./orm.jpg";
import normal from "./normal.jpg";
import { gltfTexture } from "../../helpers/gltfTexture";

/** Old bone, with ringed pips and a swirl for the 6 on the d6 (scripts/dice-textures) */
export function VaesenMaterial(
  props: JSX.IntrinsicElements["meshStandardMaterial"]
) {
  const [albedoMap, ormMap, normalMap] = useTexture(
    [albedo, orm, normal],
    (textures) => gltfTexture(textures, ["SRGB", "LINEAR", "LINEAR"])
  );

  return (
    <meshStandardMaterial
      map={albedoMap}
      aoMap={ormMap}
      roughnessMap={ormMap}
      metalnessMap={ormMap}
      normalMap={normalMap}
      {...props}
    />
  );
}
