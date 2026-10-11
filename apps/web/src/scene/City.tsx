import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { theme } from "../theme";
import { useCityStore } from "../store";
import { Buildings } from "./Buildings";
import { CameraRig } from "./CameraRig";
import { Districts } from "./Districts";
import { DroneController } from "./DroneController";
import { NatureLayer } from "./NatureLayer";
import { sceneWorldSize } from "./model";
import { Roads } from "./Roads";
import { Sky } from "./Sky";

export function City() {
  const city = useCityStore((state) => state.city);
  const setHoveredId = useCityStore((state) => state.setHoveredId);

  if (!city) {
    return <div className="scene-placeholder">Loading sample city</div>;
  }

  const worldSize = sceneWorldSize(city);
  const shadowExtent = worldSize * 0.62 + 12;

  return (
    <div className="scene-canvas" aria-label="Interactive Canopy city">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true }}
        onPointerMissed={() => setHoveredId(null)}
      >
        <color attach="background" args={[theme.skyBottom]} />
        <fog attach="fog" args={[theme.skyBottom, 110, 260]} />
        <Suspense fallback={null}>
          <Sky />
          <ambientLight intensity={0.75} />
          <directionalLight
            castShadow
            color="#ffe2b0"
            intensity={2.6}
            position={[42, 86, 34]}
            shadow-bias={-0.0004}
            shadow-camera-bottom={-shadowExtent}
            shadow-camera-far={320}
            shadow-camera-left={-shadowExtent}
            shadow-camera-right={shadowExtent}
            shadow-camera-top={shadowExtent}
            shadow-mapSize={[2048, 2048]}
            shadow-normalBias={0.04}
          />
          <hemisphereLight color="#cfeee6" groundColor="#6f9a5a" intensity={0.8} />
          <Districts city={city} worldSize={worldSize} />
          <NatureLayer city={city} worldSize={worldSize} />
          <Roads city={city} />
          <Buildings city={city} />
          <DroneController city={city} worldSize={worldSize} />
          <CameraRig city={city} worldSize={worldSize} />
        </Suspense>
      </Canvas>
    </div>
  );
}
