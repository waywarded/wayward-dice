import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";

import albedo from "./albedo.jpg";
import orm from "./orm.jpg";
import normal from "./normal.jpg";
import { gltfTexture } from "../../helpers/gltfTexture";
import { useSettingsStore } from "../../settings/store";

/**
 * Where the felt floor sits in the tray texture (its uniform dark brown also
 * turns up in the wood grain, so it's found by position, not by colour)
 */
const FELT_UV = { u0: 1071 / 2048, u1: 1552 / 2048, v0: 1034 / 2048, v1: 2037 / 2048 };

export function TrayMaterial(
  props: JSX.IntrinsicElements["meshStandardMaterial"]
) {
  const [albedoMap, ormMap, normalMap] = useTexture(
    [albedo, orm, normal],
    (textures) => gltfTexture(textures, ["SRGB", "LINEAR", "LINEAR"])
  );
  const feltColor = useSettingsStore((state) => state.feltColor);

  // The player's felt colour, if any, replaces the felt rectangle's brown
  const uniforms = useMemo(() => ({ uFelt: { value: new THREE.Color() }, uUseFelt: { value: 0 } }), []);
  useEffect(() => {
    uniforms.uUseFelt.value = feltColor ? 1 : 0;
    if (feltColor) {
      uniforms.uFelt.value.set(feltColor);
    }
  }, [feltColor, uniforms]);

  return (
    <meshStandardMaterial
      map={albedoMap}
      aoMap={ormMap}
      roughnessMap={ormMap}
      metalnessMap={ormMap}
      normalMap={normalMap}
      onBeforeCompile={(shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", "#include <common>\nuniform vec3 uFelt;\nuniform float uUseFelt;")
          .replace(
            "#include <map_fragment>",
            `#include <map_fragment>
            #ifdef USE_MAP
              if ( uUseFelt > 0.5 && vMapUv.x > ${FELT_UV.u0.toFixed(4)} && vMapUv.x < ${FELT_UV.u1.toFixed(4)}
                  && vMapUv.y > ${FELT_UV.v0.toFixed(4)} && vMapUv.y < ${FELT_UV.v1.toFixed(4)} ) {
                // The tray's lighting brightens the floor; scaled so it looks like the swatch
                diffuseColor.rgb = uFelt * 0.65;
              }
            #endif`
          );
      }}
      customProgramCacheKey={() => "wayward-tray-felt"}
      {...props}
    />
  );
}
