import { describe, expect, it } from "vitest";
import type { KeySnapshot } from "../input/keys";
import { droneSpawnForWorld, movementVectorFromKeys } from "./droneFlight";

const baseKeys: KeySnapshot = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
  boost: false,
  toggleFly: false,
  expand: false,
  escape: false,
  space: false,
  digit: null,
  yawLeft: false,
  yawRight: false,
};

describe("drone flight helpers", () => {
  it("starts the drone inside the city bounds above the canopy", () => {
    expect(droneSpawnForWorld(120)).toEqual({ x: -30, y: 14, z: 30, yaw: Math.PI * 0.25, speed: 0 });
  });

  it("derives camera-relative movement from keys and boost", () => {
    const movement = movementVectorFromKeys({ ...baseKeys, forward: true, right: true, up: true, boost: true }, 0);

    expect(movement.x).toBeCloseTo(1 / Math.SQRT2, 5);
    expect(movement.z).toBeCloseTo(-1 / Math.SQRT2, 5);
    expect(movement.y).toBe(1);
    expect(movement.speed).toBe(16);
  });
});
