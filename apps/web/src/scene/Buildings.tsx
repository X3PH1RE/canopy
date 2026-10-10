import type { ThreeEvent } from "@react-three/fiber";
import type { CityData } from "@canopy/shared";
import { theme } from "../theme";
import { useCityStore } from "../store";
import { buildingHeight, buildingVisual, fileCenter } from "./model";

interface BuildingsProps {
  city: CityData;
}

export function Buildings({ city }: BuildingsProps) {
  const selectedId = useCityStore((state) => state.selectedId);
  const hoveredId = useCityStore((state) => state.hoveredId);
  const viewMode = useCityStore((state) => state.viewMode);
  const setSelectedId = useCityStore((state) => state.setSelectedId);
  const setHoveredId = useCityStore((state) => state.setHoveredId);

  function handlePointerMiss(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    setHoveredId(null);
  }

  return (
    <group onPointerMissed={() => setSelectedId(null)}>
      {city.files.map((file) => {
        const height = buildingHeight(file.loc);
        const [x, z] = fileCenter(file);
        const isSelected = selectedId === file.id;
        const isHovered = hoveredId === file.id;
        const visual = buildingVisual(file, city.files, viewMode);

        return (
          <group key={file.id} position={[x, height / 2, z]}>
            <mesh
              castShadow
              receiveShadow
              onClick={(event) => {
                event.stopPropagation();
                setSelectedId(file.id);
              }}
              onPointerOver={(event) => {
                event.stopPropagation();
                setHoveredId(file.id);
              }}
              onPointerOut={handlePointerMiss}
              scale={isHovered ? [1.05, 1.03, 1.05] : [1, 1, 1]}
            >
              <boxGeometry args={[file.w * 0.72, height, file.d * 0.72]} />
              <meshStandardMaterial
                color={isSelected ? theme.sun : visual.color}
                emissive={isHovered || isSelected ? theme.glass : visual.emissive}
                emissiveIntensity={isSelected ? 0.28 : isHovered ? 0.16 : visual.emissiveIntensity}
                roughness={0.58}
                metalness={0.06}
              />
            </mesh>
            <mesh position={[0, height / 2 + 0.06, 0]} receiveShadow>
              <boxGeometry args={[file.w * 0.78, 0.12, file.d * 0.78]} />
              <meshStandardMaterial color={visual.roofColor} transparent opacity={0.68} roughness={0.32} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
