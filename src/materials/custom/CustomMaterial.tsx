import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useMemo } from "react";

import albedo from "../iron/albedo.jpg";
import normal from "../iron/normal.jpg";
import { gltfTexture } from "../../helpers/gltfTexture";
import { DieColors } from "../../types/Die";

/** One material per colour pair, shared by every die that uses it */
const materials = new Map<string, THREE.MeshStandardMaterial>();

/**
 * Solid dice in the player's own colours. The Iron set's albedo is grey with
 * black numbers, so its darkness says where the numbers are: the shader paints
 * the body one colour and the numbers another, keeping Iron's engraving.
 */
export function CustomMaterial({ colors }: { colors: DieColors }) {
  const [albedoMap, normalMap] = useTexture([albedo, normal], (textures) =>
    gltfTexture(textures, ["SRGB", "LINEAR"])
  );
  const material = useMemo(() => {
    const key = `${colors.base}|${colors.ink}`;
    let cached = materials.get(key);
    if (!cached) {
      cached = createMaterial(albedoMap, normalMap, colors);
      materials.set(key, cached);
    }
    return cached;
  }, [albedoMap, normalMap, colors.base, colors.ink]);

  return <primitive object={material} attach="material" />;
}

function createMaterial(map: THREE.Texture, normalMap: THREE.Texture, colors: DieColors) {
  const material = new THREE.MeshStandardMaterial({ map, normalMap, roughness: 0.4, metalness: 0 });
  const base = new THREE.Color(colors.base);
  const ink = new THREE.Color(colors.ink);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBase = { value: base };
    shader.uniforms.uInk = { value: ink };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uBase;\nuniform vec3 uInk;")
      .replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
          vec4 texel = texture2D( map, vMapUv );
          // Iron's body is a light grey, its numbers near black (linear values)
          float lum = dot( texel.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
          float inkAmount = clamp( ( 0.30 - lum ) / 0.28, 0.0, 1.0 );
          diffuseColor.rgb = mix( uBase, uInk, inkAmount );
        #endif`
      );
  };
  // Every custom material compiles to the same program; only the uniforms differ
  material.customProgramCacheKey = () => "wayward-custom-dice";
  return material;
}
