import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { CityData } from "@canopy/shared";
import { useKeyControls } from "../input/keys";
import { useCityStore } from "../store";
import { droneSpawnForWorld, movementVectorFromKeys } from "./droneFlight";
import { buildSpatialGrid, querySpatialGrid, resolveDroneCollision } from "./spatialGrid";
import { canopyWorldState } from "./worldState";
import { Drone } from "./Drone";

interface DroneControllerProps {
  city: CityData;
  worldSize: number;
}

export function DroneController({ city, worldSize }: DroneControllerProps) {
  const camera = useThree((state) => state.camera);
  const keys = useKeyControls(true);
  const isFlyMode = useCityStore((state) => state.isFlyMode);
  const setFlyMode = useCityStore((state) => state.setFlyMode);
  const previousToggle = useRef(false);
  const yawRef = useRef(canopyWorldState.drone.yaw);
  const dragRef = useRef<{ active: boolean; x: number }>({ active: false, x: 0 });

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
    if (!isFlyMode || typeof window === "undefined") {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
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

    const clampedDelta = Math.min(delta, 0.05);
    yawRef.current += ((keys.yawLeft ? 1 : 0) - (keys.yawRight ? 1 : 0)) * clampedDelta * 1.8;

    const movement = movementVectorFromKeys(keys, yawRef.current);
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

    updateChaseCamera(camera, canopyWorldState.drone);
  });

  return <Drone visible={isFlyMode} />;
}

function updateChaseCamera(camera: { position: Vector3; lookAt: (target: Vector3) => void }, drone: typeof canopyWorldState.drone) {
  const forward = new Vector3(Math.sin(drone.yaw), 0, -Math.cos(drone.yaw));
  const target = new Vector3(drone.x, drone.y + 0.8, drone.z);
  const desired = target.clone().addScaledVector(forward, -12).add(new Vector3(0, 5.8, 0));
  camera.position.lerp(desired, 0.16);
  camera.lookAt(target);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
