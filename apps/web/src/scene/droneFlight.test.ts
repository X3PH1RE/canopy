import { describe, expect, it } from "vitest";
import type { KeySnapshot } from "../input/keys";
import { droneChaseTarget, droneGlideTargetForFile, droneSpawnForWorld, movementVectorFromKeys } from "./droneFlight";

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

  it("moves along the camera heading at any yaw", () => {
    const yaw = Math.PI / 2;
    const forward = movementVectorFromKeys({ ...baseKeys, forward: true }, yaw);
    const right = movementVectorFromKeys({ ...baseKeys, right: true }, yaw);

    expect(forward.x).toBeCloseTo(1, 5);
    expect(forward.z).toBeCloseTo(0, 5);
    expect(right.x).toBeCloseTo(0, 5);
    expect(right.z).toBeCloseTo(1, 5);

    const diagonal = movementVectorFromKeys({ ...baseKeys, backward: true }, Math.PI / 4);
    expect(diagonal.x).toBeCloseTo(-Math.sin(Math.PI / 4), 5);
    expect(diagonal.z).toBeCloseTo(Math.cos(Math.PI / 4), 5);
  });

  it("places search glide targets outside the building footprint above the roof", () => {
    const target = droneGlideTargetForFile(
      { id: 1, x: 10, z: 20, w: 8, d: 6, loc: 127 },
      12,
    );

    expect(target.x).toBeGreaterThan(10 + 4);
    expect(target.y).toBeGreaterThan(12);
    expect(target.z).toBeGreaterThan(20);
  });

  it("derives the orbit handoff target from the current drone pose", () => {
    expect(droneChaseTarget({ x: 4, y: 9, z: -2, yaw: 0, speed: 0 })).toEqual({ x: 4, y: 9.8, z: -2 });
  });
});
