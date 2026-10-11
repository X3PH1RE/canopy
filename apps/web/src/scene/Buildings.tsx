import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import type { CityData, FileNode } from "@canopy/shared";
import { theme } from "../theme";
import { useCityStore } from "../store";
import { bladeGeometry, makeBuildingShaderPatch, poleGeometry, sharedMaterials, shrubGeometry, unitBox } from "./assets";
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
import { solarPanelsForFiles } from "./nature";
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
  const solarIds = useMemo(() => new Set(solarPanelsForFiles(city.files).map((panel) => panel.fileId)), [city.files]);
  const turbineIds = useMemo(() => turbineFileIds(city), [city]);

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
            hasSolar={solarIds.has(file.id)}
            hasTurbine={turbineIds.has(file.id)}
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
  hasSolar: boolean;
  hasTurbine: boolean;
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
  hasSolar,
  hasTurbine,
  onHover,
  onPointerOut,
  onSelect,
  timelineFrame,
  viewMode,
}: BuildingProps) {
  const bodyRef = useRef<Mesh>(null);
  const crownRef = useRef<Group>(null);
  const detailsRef = useRef<Group>(null);
  const rotorRef = useRef<Group>(null);
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
  const seed = useMemo(() => fileSeed(file), [file]);
  const vine = useMemo(() => ({ value: 1 }), []);
  vine.value = viewMode === "language" ? 1 : 0;
  const onBeforeCompile = useMemo(() => makeBuildingShaderPatch(seed, vine), [seed, vine]);
  const shrubs = useMemo(
    () => shrubLayout(seed, detailPlan.finCount, roofWidth, roofDepth),
    [seed, detailPlan.finCount, roofWidth, roofDepth],
  );
  const panelWidth = Math.max(1.4, roofWidth * 0.5);
  const panelDepth = Math.max(0.9, roofDepth * 0.32);

  useEffect(() => {
    const body = bodyRef.current;
    const crown = crownRef.current;
    const details = detailsRef.current;
    if (!body || !crown) {
      return;
    }

    body.scale.set(bodyWidth, initialHeight.current, bodyDepth);
    body.position.y = initialHeight.current / 2;
    crown.position.y = initialHeight.current;
    if (details) {
      details.scale.y = 1;
    }
  }, [bodyDepth, bodyWidth]);

  useFrame((state, delta) => {
    const body = bodyRef.current;
    const crown = crownRef.current;
    const details = detailsRef.current;
    if (!body || !crown) {
      return;
    }

    const widthScale = isHovered ? Math.min(0.76, archetype.bodyScale + 0.04) : archetype.bodyScale;
    body.scale.y = nextDisplayHeight(body.scale.y, targetHeight, delta, isFinalTimelineFrame);
    body.scale.x = file.w * widthScale;
    body.scale.z = file.d * widthScale;
    body.position.y = body.scale.y / 2;
    crown.position.y = body.scale.y;
    if (details) {
      details.scale.y = body.scale.y / Math.max(0.1, initialHeight.current);
    }
    if (rotorRef.current) {
      rotorRef.current.rotation.z = state.clock.elapsedTime * 1.4 + seed;
    }
    updateLiveBuildingHeight(file.id, body.scale.y);
  });

  return (
    <group position={[x, 0, z]}>
      {detailPlan.showBase ? (
        <mesh
          geometry={unitBox}
          material={sharedMaterials.timber}
          position={[0, archetype.baseHeight / 2, 0]}
          receiveShadow
          scale={[baseWidth, archetype.baseHeight, baseDepth]}
        />
      ) : null}
      <mesh
        castShadow
        receiveShadow
        geometry={unitBox}
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
        <meshStandardMaterial
          color={isSelected ? theme.sun : isActive ? theme.gold : visual.color}
          customProgramCacheKey={() => "canopy-building-v1"}
          emissive={isHovered || isSelected || isActive ? theme.glass : pulseIntensity > 0 ? theme.sun : visual.emissive}
          emissiveIntensity={isSelected ? 0.28 : isActive ? 0.22 : isHovered ? 0.16 : Math.max(visual.emissiveIntensity, pulseIntensity)}
          onBeforeCompile={onBeforeCompile}
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>
      <group ref={detailsRef}>
        {range(detailPlan.tierCount).map((index) => {
          const t = (index + 1) / (detailPlan.tierCount + 1);
          const offsetY = initialHeight.current * (0.34 + t * 0.5);
          return (
            <mesh
              castShadow
              geometry={unitBox}
              key={`terrace-${index}`}
              material={sharedMaterials.terrace}
              position={[0, offsetY, 0]}
              receiveShadow
              scale={[bodyWidth * 1.14, 0.12, bodyDepth * 1.14]}
            />
          );
        })}
      </group>
      <group ref={crownRef} position={[0, targetHeight, 0]}>
        <mesh geometry={unitBox} position={[0, 0.07, 0]} receiveShadow scale={[roofWidth, 0.14, roofDepth]}>
          <meshStandardMaterial color={visual.roofColor} roughness={0.88} />
        </mesh>
        {shrubs.map((shrub, index) => (
          <mesh
            geometry={shrubGeometry}
            key={`shrub-${index}`}
            material={index % 2 === 0 ? sharedMaterials.shrubA : sharedMaterials.shrubB}
            position={[shrub.x, 0.14 + shrub.size * 0.55, shrub.z]}
            scale={[shrub.size, shrub.size * 0.8, shrub.size]}
          />
        ))}
        {hasSolar ? (
          <group position={[0, 0.34, 0]} rotation={[-0.22, 0, 0]}>
            <mesh geometry={unitBox} material={sharedMaterials.frame} scale={[panelWidth + 0.14, 0.05, panelDepth + 0.14]} />
            <mesh geometry={unitBox} material={sharedMaterials.solar} position={[0, 0.04, 0]} scale={[panelWidth, 0.05, panelDepth]} />
          </group>
        ) : null}
        {hasTurbine ? (
          <group position={[roofWidth * 0.28, 0, roofDepth * 0.28]}>
            <mesh castShadow geometry={poleGeometry} material={sharedMaterials.turbine} position={[0, 1.6, 0]} scale={[0.18, 3.2, 0.18]} />
            <group position={[0, 3.3, 0.12]} ref={rotorRef}>
              {[0, 1, 2].map((blade) => (
                <group key={blade} rotation={[0, 0, (blade * Math.PI * 2) / 3]}>
                  <mesh geometry={bladeGeometry} material={sharedMaterials.turbine} position={[0, 0.8, 0]} scale={[1, 1.6, 1]} />
                </group>
              ))}
            </group>
          </group>
        ) : null}
      </group>
    </group>
  );
}

function turbineFileIds(city: CityData): Set<number> {
  const count = Math.min(6, Math.max(1, Math.round(city.files.length / 40)));
  return new Set(
    [...city.files]
      .filter((file) => file.loc >= 300 && file.w >= 4 && file.d >= 4)
      .sort((a, b) => b.loc - a.loc || a.id - b.id)
      .slice(0, count)
      .map((file) => file.id),
  );
}

function shrubLayout(seed: number, count: number, width: number, depth: number) {
  const shrubs: Array<{ x: number; z: number; size: number }> = [];
  for (let index = 0; index < Math.min(3, count); index += 1) {
    const a = ((seed >>> (index * 5)) % 100) / 100;
    const b = ((seed >>> (index * 5 + 2)) % 100) / 100;
    shrubs.push({
      x: (a - 0.5) * width * 0.7,
      z: (b - 0.5) * depth * 0.7,
      size: Math.min(0.5, 0.26 + a * 0.2),
    });
  }
  return shrubs;
}

function fileSeed(file: FileNode): number {
  let result = 2166136261;
  const value = `${file.id}:${file.path}`;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}
