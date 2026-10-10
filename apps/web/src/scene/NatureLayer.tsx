import { useEffect, useMemo, useRef } from "react";
import { Color, Object3D, type InstancedMesh } from "three";
import type { CityData } from "@canopy/shared";
import { theme } from "../theme";
import { solarPanelY, solarPanelsForFiles, treePlacementsForCity } from "./nature";
import { canopyWorldState } from "./worldState";

interface NatureLayerProps {
  city: CityData;
  worldSize: number;
}

export function NatureLayer({ city, worldSize }: NatureLayerProps) {
  const trunkRef = useRef<InstancedMesh>(null);
  const canopyRef = useRef<InstancedMesh>(null);
  const trees = useMemo(() => treePlacementsForCity(city, worldSize), [city, worldSize]);
  const panels = useMemo(() => solarPanelsForFiles(city.files), [city.files]);

  useEffect(() => {
    const trunk = trunkRef.current;
    const canopy = canopyRef.current;
    if (!trunk || !canopy) {
      return;
    }

    const object = new Object3D();
    const trunkColor = new Color(theme.timber);
    const canopyA = new Color("#4f8f64");
    const canopyB = new Color("#8cbf7a");

    trees.forEach((tree, index) => {
      object.position.set(tree.x, 0.75 * tree.scale, tree.z);
      object.scale.set(0.22 * tree.scale, 1.5 * tree.scale, 0.22 * tree.scale);
      object.updateMatrix();
      trunk.setMatrixAt(index, object.matrix);
      trunk.setColorAt(index, trunkColor);

      object.position.set(tree.x, 1.72 * tree.scale, tree.z);
      object.scale.set(1.1 * tree.scale, 0.82 * tree.scale, 1.1 * tree.scale);
      object.updateMatrix();
      canopy.setMatrixAt(index, object.matrix);
      canopy.setColorAt(index, canopyA.clone().lerp(canopyB, tree.hue));
    });

    trunk.instanceMatrix.needsUpdate = true;
    canopy.instanceMatrix.needsUpdate = true;
    trunk.instanceColor!.needsUpdate = true;
    canopy.instanceColor!.needsUpdate = true;
  }, [trees]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 7]} />
        <meshStandardMaterial roughness={0.72} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, trees.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.78} />
      </instancedMesh>
      {panels.map((panel) => (
        <mesh
          key={panel.fileId}
          position={[panel.x, solarPanelY(canopyWorldState.liveHeights.get(panel.fileId) ?? panel.y), panel.z]}
          rotation={[-0.08, 0, Math.PI / 14]}
          receiveShadow
        >
          <boxGeometry args={[panel.width, 0.08, panel.depth]} />
          <meshStandardMaterial color="#224e60" emissive="#8fd3c8" emissiveIntensity={0.08} roughness={0.22} metalness={0.28} />
        </mesh>
      ))}
      <RailPulse worldSize={worldSize} />
    </group>
  );
}

function RailPulse({ worldSize }: { worldSize: number }) {
  return (
    <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[worldSize * 0.46, worldSize * 0.462, 96]} />
      <meshBasicMaterial color="#f2a900" transparent opacity={0.22} />
    </mesh>
  );
}
