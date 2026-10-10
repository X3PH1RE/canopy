import type { KeySnapshot } from "../input/keys";
import type { DroneWorldState } from "./worldState";

export interface DroneMovement {
  x: number;
  y: number;
  z: number;
  speed: number;
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
    x: normalizedX * cos + normalizedZ * sin,
    y: (keys.up ? 1 : 0) - (keys.down ? 1 : 0),
    z: normalizedX * sin + normalizedZ * cos,
    speed: keys.boost ? 16 : 9,
  };
}
