import type { KeySnapshot } from "../input/keys";
import type { DroneWorldState } from "./worldState";

export interface DroneMovement {
  x: number;
  y: number;
  z: number;
  speed: number;
}

export interface GlideTargetFile {
  id: number;
  x: number;
  z: number;
  w: number;
  d: number;
  loc: number;
}

export function droneSpawnForWorld(worldSize: number): DroneWorldState {
  const offset = Math.max(18, Math.min(34, worldSize * 0.25));
  return {
    x: -offset,
    y: 14,
    z: offset,
    yaw: Math.PI * 0.25,
    speed: 0,
  };
}

export function movementVectorFromKeys(keys: KeySnapshot, yaw: number): DroneMovement {
  const localX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const localZ = (keys.backward ? 1 : 0) - (keys.forward ? 1 : 0);
  const length = Math.hypot(localX, localZ);
  const normalizedX = length > 0 ? localX / length : 0;
  const normalizedZ = length > 0 ? localZ / length : 0;
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);

  return {
    // Camera forward is (sin yaw, -cos yaw) and right is (cos yaw, sin yaw); local z is negative when moving forward.
    x: normalizedX * cos - normalizedZ * sin,
    y: (keys.up ? 1 : 0) - (keys.down ? 1 : 0),
    z: normalizedX * sin + normalizedZ * cos,
    speed: keys.boost ? 16 : 9,
  };
}

export function droneGlideTargetForFile(file: GlideTargetFile, liveHeight: number): DroneWorldState {
  const offset = Math.max(file.w, file.d) * 0.65 + 3.5;
  return {
    x: file.x + offset,
    y: Math.max(8, liveHeight + 3.2),
    z: file.z + offset * 0.55,
    yaw: Math.PI * 0.75,
    speed: 0,
  };
}

export function droneChaseTarget(drone: DroneWorldState): { x: number; y: number; z: number } {
  return {
    x: drone.x,
    y: drone.y + 0.8,
    z: drone.z,
  };
}
