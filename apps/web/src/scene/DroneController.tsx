import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { CityData } from "@canopy/shared";
import { isEditableTarget, useKeyControls } from "../input/keys";
import { useCityStore } from "../store";
import { droneChaseTarget, droneGlideTargetForFile, droneSpawnForWorld, movementVectorFromKeys } from "./droneFlight";
import { fileById } from "./model";
import { initialProximityState, updateProximity, type ProximityState } from "./proximity";
import { buildSpatialGrid, querySpatialGrid, resolveDroneCollision } from "./spatialGrid";
import { canopyWorldState } from "./worldState";
import { Drone } from "./Drone";
import { DronePopup } from "./DronePopup";

interface DroneControllerProps {
  city: CityData;
  worldSize: number;
}

export function DroneController({ city, worldSize }: DroneControllerProps) {
  const camera = useThree((state) => state.camera);
  const keys = useKeyControls(true);
  const isFlyMode = useCityStore((state) => state.isFlyMode);
  const focusRequest = useCityStore((state) => state.focusRequest);
  const setFlyMode = useCityStore((state) => state.setFlyMode);
  const setSelectedId = useCityStore((state) => state.setSelectedId);
  const setActiveBuildingId = useCityStore((state) => state.setActiveBuildingId);
  const previousToggle = useRef(false);
  const previousExpand = useRef(false);
  const previousEscape = useRef(false);
  const yawRef = useRef(canopyWorldState.drone.yaw);
  const dragRef = useRef<{ active: boolean; x: number }>({ active: false, x: 0 });
  const proximityRef = useRef<ProximityState>(initialProximityState());
  const glideTargetRef = useRef<typeof canopyWorldState.drone | null>(null);

  useEffect(() => {
    const next = droneSpawnForWorld(worldSize);
    canopyWorldState.drone = next;
    yawRef.current = next.yaw;
  }, [city, worldSize]);

  useEffect(() => {
    if (keys.toggleFly && !previousToggle.current) {
      setFlyMode(!useCityStore.getState().isFlyMode);
    }
    previousToggle.current = keys.toggleFly;
  }, [keys.toggleFly, setFlyMode]);

  useEffect(() => {
    if (!isFlyMode || !focusRequest) {
      return;
    }

    const file = fileById(city.files, focusRequest.fileId);
    if (!file) {
      return;
    }

    const height = canopyWorldState.liveHeights.get(file.id) ?? 4;
    glideTargetRef.current = droneGlideTargetForFile(file, height);
    proximityRef.current = initialProximityState();
    setActiveBuildingId(null);
  }, [city.files, focusRequest, isFlyMode, setActiveBuildingId]);

  useEffect(() => {
    if (!isFlyMode || typeof window === "undefined") {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!isFlyDragTarget(event.target)) {
        return;
      }
      dragRef.current = { active: true, x: event.clientX };
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragRef.current.active) {
        return;
      }
      const dx = event.clientX - dragRef.current.x;
      dragRef.current.x = event.clientX;
      yawRef.current -= dx * 0.006;
    }

    function handlePointerUp() {
      dragRef.current.active = false;
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isFlyMode]);

  useFrame((_, delta) => {
    if (!isFlyMode) {
      return;
    }

    const activeId = useCityStore.getState().activeBuildingId;
    if (keys.expand && !previousExpand.current && activeId !== null) {
      setSelectedId(activeId);
    }
    if (keys.escape && !previousEscape.current) {
      setActiveBuildingId(null);
      proximityRef.current = initialProximityState();
    }
    previousExpand.current = keys.expand;
    previousEscape.current = keys.escape;

    const clampedDelta = Math.min(delta, 0.05);
    yawRef.current += ((keys.yawLeft ? 1 : 0) - (keys.yawRight ? 1 : 0)) * clampedDelta * 1.8;

    const glideTarget = glideTargetRef.current;
    const movement = glideTarget ? glideMovementToward(glideTarget) : movementVectorFromKeys(keys, yawRef.current);
    if (glideTarget) {
      yawRef.current = glideTarget.yaw;
    }
    const drone = canopyWorldState.drone;
    const targetVelocity = {
      x: movement.x * movement.speed,
      y: movement.y * movement.speed * 0.7,
      z: movement.z * movement.speed,
    };
    const nextPosition = {
      x: clamp(drone.x + targetVelocity.x * clampedDelta, -worldSize * 0.55, worldSize * 0.55),
      y: clamp(drone.y + targetVelocity.y * clampedDelta, 2.6, 58),
      z: clamp(drone.z + targetVelocity.z * clampedDelta, -worldSize * 0.55, worldSize * 0.55),
    };

    const grid = buildSpatialGrid(canopyWorldState.buildingBoxes);
    const candidates = querySpatialGrid(grid, nextPosition.x, nextPosition.z, 1.2);
    const collision = resolveDroneCollision(nextPosition, targetVelocity, candidates, 1.2);
    canopyWorldState.drone = {
      x: clamp(collision.position.x, -worldSize * 0.55, worldSize * 0.55),
      y: collision.position.y,
      z: clamp(collision.position.z, -worldSize * 0.55, worldSize * 0.55),
      yaw: yawRef.current,
      speed: Math.hypot(collision.velocity.x, collision.velocity.z),
    };

    if (glideTarget && distanceToDrone(glideTarget) < 1.2) {
      glideTargetRef.current = null;
    }

    const nearestId = nearestBuildingId(canopyWorldState.drone.x, canopyWorldState.drone.y, canopyWorldState.drone.z);
    const proximity = updateProximity(proximityRef.current, {
      nearestId,
      nowMs: performance.now(),
      speed: canopyWorldState.drone.speed,
    });
    proximityRef.current = proximity;
    if (proximity.activeId !== useCityStore.getState().activeBuildingId) {
      setActiveBuildingId(proximity.activeId);
    }

    updateChaseCamera(camera, canopyWorldState.drone);
  });

  return (
    <>
      <Drone visible={isFlyMode} />
      {isFlyMode ? <DronePopup city={city} /> : null}
    </>
  );
}

function updateChaseCamera(camera: { position: Vector3; lookAt: (target: Vector3) => void }, drone: typeof canopyWorldState.drone) {
  const forward = new Vector3(Math.sin(drone.yaw), 0, -Math.cos(drone.yaw));
  const chaseTarget = droneChaseTarget(drone);
  const target = new Vector3(chaseTarget.x, chaseTarget.y, chaseTarget.z);
  const desired = target.clone().addScaledVector(forward, -12).add(new Vector3(0, 5.8, 0));
  camera.position.lerp(desired, 0.16);
  camera.lookAt(target);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function glideMovementToward(target: typeof canopyWorldState.drone) {
  const drone = canopyWorldState.drone;
  const dx = target.x - drone.x;
  const dy = target.y - drone.y;
  const dz = target.z - drone.z;
  const horizontal = Math.hypot(dx, dz);
  const length = Math.hypot(dx, dy, dz);

  if (length < 0.01) {
    return { x: 0, y: 0, z: 0, speed: 0 };
  }

  return {
    x: horizontal > 0 ? dx / horizontal : 0,
    y: dy / Math.max(1, length),
    z: horizontal > 0 ? dz / horizontal : 0,
    speed: 11,
  };
}

function distanceToDrone(target: typeof canopyWorldState.drone): number {
  const drone = canopyWorldState.drone;
  return Math.hypot(target.x - drone.x, target.y - drone.y, target.z - drone.z);
}

function nearestBuildingId(x: number, y: number, z: number): number | null {
  const grid = buildSpatialGrid(canopyWorldState.buildingBoxes);
  const candidates = querySpatialGrid(grid, x, z, 5.2).filter((box) => y >= box.minY && y <= box.maxY + 5);
  let best: { id: number; distance: number } | null = null;

  for (const box of candidates) {
    const distance = Math.hypot(x - box.x, z - box.z);
    if (!best || distance < best.distance) {
      best = { id: box.fileId, distance };
    }
  }

  return best?.id ?? null;
}

export function isFlyDragTarget(target: EventTarget | null): boolean {
  if (isEditableTarget(target)) {
    return false;
  }

  const element = target as { closest?: (selector: string) => unknown } | null;
  return !element?.closest?.(".top-bar, .stats-banner, .search-box, .inspect-panel, .fly-hud, button");
}
