import { useMemo } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { DiceTransform } from "../types/DiceTransform";

import { useSpring, animated, config } from "@react-spring/three";
import { useThree } from "@react-three/fiber";

const FOV = 28;
/** Roughly a die's radius, so a die at the edge isn't cut in half */
const DIE_MARGIN = 0.15;
/** Sees the whole tray */
const MAX_HEIGHT = 4.3;

export function AnimatedPlayerCamera({
  rollTransforms,
}: {
  rollTransforms: Record<string, DiceTransform> | undefined;
}) {
  const { invalidate } = useThree();

  const cameraPosition = useMemo<[number, number, number]>(() => {
    if (rollTransforms) {
      const transforms = Object.values(rollTransforms);
      if (transforms.length > 0) {
        const bounds = getBoundingBox(transforms);
        // High enough that every die (plus its own size) fits the square view
        const half = Math.max(bounds.width, bounds.height) / 2 + DIE_MARGIN;
        const y = Math.min(MAX_HEIGHT, Math.max(1, half / Math.tan(((FOV / 2) * Math.PI) / 180)));
        const x = Math.min(0.8, Math.max(-0.8, bounds.center.x));
        const z = Math.min(0.8, Math.max(-0.8, bounds.center.y));
        return [x, y, z];
      } else {
        return [0, 3, 0];
      }
    } else {
      return [0, 3, 0];
    }
  }, [rollTransforms]);

  const { position } = useSpring({
    position: cameraPosition,
    onChange: () => invalidate(),
    config: config.slow,
  });

  return (
    <>
      <animated.group position={position as any /* react-spring 9 types predate @types/three 0.18x */}>
        <PerspectiveCamera
          makeDefault
          fov={FOV}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </animated.group>
    </>
  );
}

type BoundingBox = {
  min: { x: number; y: number };
  max: { x: number; y: number };
  width: number;
  height: number;
  center: { x: number; y: number };
};

function getBoundingBox(transforms: DiceTransform[]): BoundingBox {
  let minX = Number.MAX_SAFE_INTEGER;
  let maxX = Number.MIN_SAFE_INTEGER;
  let minZ = Number.MAX_SAFE_INTEGER;
  let maxZ = Number.MIN_SAFE_INTEGER;
  for (let t of transforms) {
    minX = t.position.x < minX ? t.position.x : minX;
    maxX = t.position.x > maxX ? t.position.x : maxX;
    minZ = t.position.z < minZ ? t.position.z : minZ;
    maxZ = t.position.z > maxZ ? t.position.z : maxZ;
  }
  let width = maxX - minX;
  let height = maxZ - minZ;
  let center = { x: (minX + maxX) / 2, y: (minZ + maxZ) / 2 };
  return {
    min: { x: minX, y: minZ },
    max: { x: maxX, y: maxZ },
    width,
    height,
    center,
  };
}
