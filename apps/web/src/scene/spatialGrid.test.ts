import { describe, expect, it } from "vitest";
import type { BuildingBox } from "./worldState";
import { buildSpatialGrid, querySpatialGrid, resolveDroneCollision } from "./spatialGrid";

function box(fileId: number, x: number, z: number, width = 4, depth = 4, height = 8): BuildingBox {
  return {
    fileId,
    x,
    z,
    halfW: width / 2,
    halfD: depth / 2,
    minX: x - width / 2,
    maxX: x + width / 2,
    minY: 0,
    maxY: height,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  };
}

describe("spatial grid", () => {
  it("returns boxes that intersect the query radius", () => {
    const grid = buildSpatialGrid([box(1, 0, 0), box(2, 30, 0)], 10);

    expect(querySpatialGrid(grid, 1, 1, 4).map((candidate) => candidate.fileId)).toEqual([1]);
    expect(querySpatialGrid(grid, 16, 0, 3)).toEqual([]);
  });

  it("pushes the drone outside overlapping buildings", () => {
    const result = resolveDroneCollision(
      { x: 1.8, y: 4, z: 0 },
      { x: -2, y: 0, z: 0 },
      [box(1, 0, 0)],
      1,
    );

    expect(result.position.x).toBeGreaterThanOrEqual(3);
    expect(result.velocity.x).toBe(0);
    expect(result.collidedWith).toEqual([1]);
  });

  it("preserves tangential velocity for sliding", () => {
    const result = resolveDroneCollision(
      { x: 1.8, y: 4, z: 0 },
      { x: -2, y: 0, z: 5 },
      [box(1, 0, 0)],
      1,
    );

    expect(result.velocity.x).toBe(0);
    expect(result.velocity.z).toBe(5);
  });

  it("ignores buildings below or above the drone altitude", () => {
    const result = resolveDroneCollision(
      { x: 1, y: 12, z: 1 },
      { x: -2, y: 0, z: 0 },
      [box(1, 0, 0, 6, 6, 5)],
      1,
    );

    expect(result.collidedWith).toEqual([]);
    expect(result.position).toEqual({ x: 1, y: 12, z: 1 });
  });
});
