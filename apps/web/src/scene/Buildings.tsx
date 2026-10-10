import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Mesh } from "three";
import type { CityData, FileNode } from "@canopy/shared";
import { theme } from "../theme";
import { useCityStore } from "../store";
import {
  buildingHeight,
  buildingVisual,
  fileCenter,
  fileLocAtFrame,
  filePulseIntensity,
  nextDisplayHeight,
  type ViewMode,
} from "./model";
import { syncCityWorldState, updateLiveBuildingHeight } from "./worldState";

interface BuildingsProps {
  city: CityData;
}

export function Buildings({ city }: BuildingsProps) {
  const selectedId = useCityStore((state) => state.selectedId);
  const hoveredId = useCityStore((state) => state.hoveredId);
  const activeBuildingId = useCityStore((state) => state.activeBuildingId);
  const viewMode = useCityStore((state) => state.viewMode);
  const timelineFrame = useCityStore((state) => state.timelineFrame);
  const setSelectedId = useCityStore((state) => state.setSelectedId);
  const setHoveredId = useCityStore((state) => state.setHoveredId);

  useEffect(() => {
    syncCityWorldState(city);
  }, [city]);

  function handlePointerMiss(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    setHoveredId(null);
  }

  return (
    <group onPointerMissed={() => setSelectedId(null)}>
      {city.files.map((file) => {
        return (
          <Building
            city={city}
            file={file}
            isHovered={hoveredId === file.id}
            isSelected={selectedId === file.id}
            isActive={activeBuildingId === file.id}
            key={file.id}
            onPointerOut={handlePointerMiss}
            onSelect={setSelectedId}
            onHover={setHoveredId}
            timelineFrame={timelineFrame}
            viewMode={viewMode}
          />
        );
      })}
    </group>
  );
}

interface BuildingProps {
  city: CityData;
  file: FileNode;
  isHovered: boolean;
  isSelected: boolean;
  isActive: boolean;
  onHover: (id: number | null) => void;
  onPointerOut: (event: ThreeEvent<PointerEvent>) => void;
  onSelect: (id: number | null) => void;
  timelineFrame: number;
  viewMode: ViewMode;
}

function Building({
  city,
  file,
  isHovered,
  isSelected,
  isActive,
  onHover,
  onPointerOut,
  onSelect,
  timelineFrame,
  viewMode,
}: BuildingProps) {
  const bodyRef = useRef<Mesh>(null);
  const roofRef = useRef<Mesh>(null);
  const targetLoc = fileLocAtFrame(file, city.timeline, timelineFrame);
  const targetHeight = buildingHeight(targetLoc);
  const isFinalTimelineFrame = Boolean(city.timeline && timelineFrame >= city.timeline.frameCount - 1);
  const initialHeight = useRef(targetHeight);
  const [x, z] = fileCenter(file);
  const visual = buildingVisual(file, city.files, viewMode);
  const pulseIntensity = filePulseIntensity(file.id, city.timeline, timelineFrame, 5);

  useEffect(() => {
    const body = bodyRef.current;
    const roof = roofRef.current;
    if (!body || !roof) {
      return;
    }

    body.scale.set(file.w * 0.72, initialHeight.current, file.d * 0.72);
    body.position.y = initialHeight.current / 2;
    roof.position.y = initialHeight.current + 0.06;
  }, [file.d, file.w]);

  useFrame((_, delta) => {
    const body = bodyRef.current;
    const roof = roofRef.current;
    if (!body || !roof) {
      return;
    }

    const widthScale = isHovered ? 0.76 : 0.72;
    body.scale.y = nextDisplayHeight(body.scale.y, targetHeight, delta, isFinalTimelineFrame);
    body.scale.x = file.w * widthScale;
    body.scale.z = file.d * widthScale;
    body.position.y = body.scale.y / 2;
    roof.position.y = body.scale.y + 0.06;
    updateLiveBuildingHeight(file.id, body.scale.y);
  });

  return (
    <group position={[x, 0, z]}>
      <mesh
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelect(file.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(file.id);
        }}
        onPointerOut={onPointerOut}
        ref={bodyRef}
        scale={[file.w * 0.72, initialHeight.current, file.d * 0.72]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={isSelected ? theme.sun : isActive ? theme.gold : visual.color}
          emissive={isHovered || isSelected || isActive ? theme.glass : pulseIntensity > 0 ? theme.sun : visual.emissive}
          emissiveIntensity={isSelected ? 0.28 : isActive ? 0.22 : isHovered ? 0.16 : Math.max(visual.emissiveIntensity, pulseIntensity)}
          roughness={0.58}
          metalness={0.06}
        />
      </mesh>
      <mesh ref={roofRef} position={[0, targetHeight + 0.06, 0]} receiveShadow>
        <boxGeometry args={[file.w * 0.78, 0.12, file.d * 0.78]} />
        <meshStandardMaterial color={visual.roofColor} transparent opacity={0.68} roughness={0.32} />
      </mesh>
    </group>
  );
}
