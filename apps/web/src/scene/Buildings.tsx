import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group, Mesh } from "three";
import type { CityData, FileNode } from "@canopy/shared";
import { theme } from "../theme";
import { useCityStore } from "../store";
import {
  buildingArchetype,
  buildingDetailPlan,
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
  const detailsRef = useRef<Group>(null);
  const targetLoc = fileLocAtFrame(file, city.timeline, timelineFrame);
  const targetHeight = buildingHeight(targetLoc);
  const isFinalTimelineFrame = Boolean(city.timeline && timelineFrame >= city.timeline.frameCount - 1);
  const initialHeight = useRef(targetHeight);
  const [x, z] = fileCenter(file);
  const visual = buildingVisual(file, city.files, viewMode);
  const archetype = buildingArchetype(file);
  const detailPlan = buildingDetailPlan(file, archetype, city.files.length, isHovered || isSelected || isActive);
  const pulseIntensity = filePulseIntensity(file.id, city.timeline, timelineFrame, 5);
  const bodyWidth = file.w * archetype.bodyScale;
  const bodyDepth = file.d * archetype.bodyScale;
  const roofWidth = file.w * archetype.roofScale;
  const roofDepth = file.d * archetype.roofScale;
  const baseWidth = file.w * archetype.baseScale;
  const baseDepth = file.d * archetype.baseScale;

  useEffect(() => {
    const body = bodyRef.current;
    const roof = roofRef.current;
    const details = detailsRef.current;
    if (!body || !roof) {
      return;
    }

    body.scale.set(bodyWidth, initialHeight.current, bodyDepth);
    body.position.y = initialHeight.current / 2;
    roof.position.y = initialHeight.current + 0.06;
    if (details) {
      details.scale.y = 1;
    }
  }, [bodyDepth, bodyWidth]);

  useFrame((_, delta) => {
    const body = bodyRef.current;
    const roof = roofRef.current;
    const details = detailsRef.current;
    if (!body || !roof) {
      return;
    }

    const widthScale = isHovered ? Math.min(0.76, archetype.bodyScale + 0.04) : archetype.bodyScale;
    body.scale.y = nextDisplayHeight(body.scale.y, targetHeight, delta, isFinalTimelineFrame);
    body.scale.x = file.w * widthScale;
    body.scale.z = file.d * widthScale;
    body.position.y = body.scale.y / 2;
    roof.position.y = body.scale.y + 0.06;
    if (details) {
      details.scale.y = body.scale.y / Math.max(0.1, initialHeight.current);
    }
    updateLiveBuildingHeight(file.id, body.scale.y);
  });

  return (
    <group position={[x, 0, z]}>
      {detailPlan.showBase ? (
        <mesh position={[0, archetype.baseHeight / 2, 0]} receiveShadow>
          <boxGeometry args={[baseWidth, archetype.baseHeight, baseDepth]} />
          <meshStandardMaterial color={theme.timber} roughness={0.72} metalness={0.02} />
        </mesh>
      ) : null}
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
        scale={[bodyWidth, initialHeight.current, bodyDepth]}
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
      <group ref={detailsRef}>
        {range(detailPlan.finCount).map((index) => {
          const offsetX = distribute(index, detailPlan.finCount, bodyWidth * 0.76);
          return (
            <group key={`fin-${index}`}>
              <mesh position={[offsetX, initialHeight.current * 0.5, bodyDepth / 2 + 0.035]} castShadow>
                <boxGeometry args={[0.06, initialHeight.current * 0.88, 0.08]} />
                <meshStandardMaterial color={theme.sun} transparent opacity={0.42} roughness={0.38} />
              </mesh>
              <mesh position={[offsetX, initialHeight.current * 0.5, -bodyDepth / 2 - 0.035]} castShadow>
                <boxGeometry args={[0.06, initialHeight.current * 0.88, 0.08]} />
                <meshStandardMaterial color={theme.sun} transparent opacity={0.28} roughness={0.38} />
              </mesh>
            </group>
          );
        })}
        {range(detailPlan.windowBandCount).map((index) => {
          const offsetY = ((index + 1) / (detailPlan.windowBandCount + 1)) * initialHeight.current;
          const bandWidth = bodyWidth * (archetype.kind === "slimTower" ? 0.62 : 0.76);
          return (
            <group key={`band-${index}`}>
              <mesh position={[0, offsetY, bodyDepth / 2 + 0.045]}>
                <boxGeometry args={[bandWidth, 0.07, 0.045]} />
                <meshStandardMaterial
                  color={theme.glass}
                  emissive={theme.glass}
                  emissiveIntensity={0.16}
                  transparent
                  opacity={0.48}
                  roughness={0.18}
                />
              </mesh>
              <mesh position={[0, offsetY, -bodyDepth / 2 - 0.045]}>
                <boxGeometry args={[bandWidth, 0.07, 0.045]} />
                <meshStandardMaterial
                  color={theme.glass}
                  emissive={theme.glass}
                  emissiveIntensity={0.1}
                  transparent
                  opacity={0.32}
                  roughness={0.18}
                />
              </mesh>
            </group>
          );
        })}
        {range(detailPlan.tierCount).map((index) => {
          const t = (index + 1) / (detailPlan.tierCount + 1);
          const tierScale = 1 - archetype.crownInset * t;
          const offsetY = initialHeight.current * (0.68 + t * 0.22);
          return (
            <mesh key={`tier-${index}`} position={[0, offsetY, 0]} castShadow receiveShadow>
              <boxGeometry args={[bodyWidth * tierScale, 0.12, bodyDepth * tierScale]} />
              <meshStandardMaterial color={visual.roofColor} transparent opacity={0.56} roughness={0.42} />
            </mesh>
          );
        })}
      </group>
      <mesh ref={roofRef} position={[0, targetHeight + 0.06, 0]} receiveShadow>
        <boxGeometry args={[roofWidth, 0.12, roofDepth]} />
        <meshStandardMaterial color={visual.roofColor} transparent opacity={0.68} roughness={0.32} />
      </mesh>
    </group>
  );
}

function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

function distribute(index: number, count: number, width: number): number {
  if (count <= 1) {
    return 0;
  }

  return -width / 2 + (width * index) / (count - 1);
}
