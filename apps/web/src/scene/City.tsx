import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { theme } from "../theme";
import { useCityStore } from "../store";
import { Buildings } from "./Buildings";
import { CameraRig } from "./CameraRig";
import { Districts } from "./Districts";
import { DroneController } from "./DroneController";
import { sceneWorldSize } from "./model";
import { Roads } from "./Roads";

export function City() {
  const city = useCityStore((state) => state.city);
  const setHoveredId = useCityStore((state) => state.setHoveredId);

  if (!city) {
    return <div className="scene-placeholder">Loading sample city</div>;
  }

  const worldSize = sceneWorldSize(city);

  return (
    <div className="scene-canvas" aria-label="Interactive Canopy city">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true }}
        onPointerMissed={() => setHoveredId(null)}
      >
        <color attach="background" args={[theme.skyTop]} />
        <fog attach="fog" args={[theme.skyBottom, 82, 172]} />
        <Suspense fallback={null}>
          <ambientLight intensity={1.1} />
          <directionalLight
            castShadow
            color={theme.sun}
            intensity={2.2}
            position={[42, 86, 34]}
            shadow-mapSize={[2048, 2048]}
          />
          <hemisphereLight color={theme.skyTop} groundColor={theme.ground} intensity={0.9} />
          <Districts city={city} worldSize={worldSize} />
          <Roads city={city} />
          <Buildings city={city} />
          <DroneController city={city} worldSize={worldSize} />
          <CameraRig city={city} worldSize={worldSize} />
        </Suspense>
      </Canvas>
    </div>
  );
}
