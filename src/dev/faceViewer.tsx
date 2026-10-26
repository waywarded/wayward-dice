import React, { Suspense, useLayoutEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrthographicCamera } from "@react-three/drei";

import environment from "../environment.hdr";
import { Dice } from "../dice/Dice";
import { DiceStyle } from "../types/DiceStyle";
import { DiceType } from "../types/DiceType";

/**
 * Development only: shows chosen faces of dice face-up, for checking custom
 * faces (scripts/dice-textures). ?style=DRAGONBANE&type=D20&faces=1,20&compare=IRON
 */
const params = new URLSearchParams(location.search);
const style = (params.get("style") ?? "DRAGONBANE") as DiceStyle;
const compare = params.get("compare") as DiceStyle | null;
const type = (params.get("type") ?? "D20") as DiceType;
const faces = (params.get("faces") ?? "1,20").split(",").map(Number);
const prefix = { D4: "004", D6: "006", D8: "008", D10: "010", D12: "012", D20: "020", D100: "100" }[type];

const up = new THREE.Vector3(0, 1, 0);

/** A die turned so the given face points up at the camera */
function FaceUp({ dieStyle, face, x, z }: { dieStyle: DiceStyle; face: number; x: number; z: number }) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const locator = inner.current?.getObjectByName(`${prefix}_locator_${face}`);
    const mesh = locator?.parent;
    if (!locator || !mesh || !outer.current) {
      return;
    }
    const centre = new THREE.Vector3();
    const point = new THREE.Vector3();
    mesh.getWorldPosition(centre);
    locator.getWorldPosition(point);
    const direction = point.sub(centre).normalize();
    outer.current.quaternion.setFromUnitVectors(direction, up);
  });
  return (
    <group position={[x, 0, z]}>
      <group ref={outer}>
        <Dice ref={inner} die={{ id: `${dieStyle}-${face}`, style: dieStyle, type }} />
      </group>
    </group>
  );
}

/** Renders on a timer, so it also draws in a background tab (no animation frames) */
function TimerRender() {
  const advance = useThree((state) => state.advance);
  useLayoutEffect(() => {
    const timer = setInterval(() => advance(performance.now()), 300);
    return () => clearInterval(timer);
  }, [advance]);
  return null;
}

function App() {
  const rows = compare ? [style, compare] : [style];
  return (
    <Canvas frameloop="never" style={{ width: "100vw", height: "100vh", background: "#333" }}>
      <TimerRender />
      <Suspense fallback={null}>
        <Environment files={environment} />
        <OrthographicCamera makeDefault position={[0, 5, 0]} rotation={[-Math.PI / 2, 0, 0]} zoom={Number(params.get("zoom") ?? 260)} />
        {rows.map((rowStyle, row) =>
          faces.map((face, i) => (
            <FaceUp key={`${rowStyle}-${face}`} dieStyle={rowStyle} face={face} x={(i - (faces.length - 1) / 2) * 0.32} z={(row - (rows.length - 1) / 2) * 0.32} />
          ))
        )}
      </Suspense>
    </Canvas>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
