import type { ThreeEvent } from "@react-three/fiber";
import type { CityData, FileNode } from "@canopy/shared";
import { languageColors, theme } from "../theme";
import { useCityStore } from "../store";
import { buildingHeight, fileCenter } from "./model";

interface BuildingsProps {
  city: CityData;
}

export function Buildings({ city }: BuildingsProps) {
  const selectedId = useCityStore((state) => state.selectedId);
  const hoveredId = useCityStore((state) => state.hoveredId);
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
        const baseColor = languageColors[file.language] ?? languageColors.other;

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
                color={isSelected ? theme.sun : baseColor}
                emissive={isHovered || isSelected ? theme.glass : "#000000"}
                emissiveIntensity={isSelected ? 0.28 : isHovered ? 0.16 : 0}
                roughness={0.58}
                metalness={0.06}
              />
            </mesh>
            <mesh position={[0, height / 2 + 0.06, 0]} receiveShadow>
              <boxGeometry args={[file.w * 0.78, 0.12, file.d * 0.78]} />
              <meshStandardMaterial color={theme.glass} transparent opacity={0.58} roughness={0.2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
