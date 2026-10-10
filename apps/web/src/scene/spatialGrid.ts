import type { BuildingBox } from "./worldState";

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface SpatialGrid {
  cellSize: number;
  cells: Map<string, BuildingBox[]>;
}

export interface CollisionResult {
  position: Vector3Like;
  velocity: Vector3Like;
  collidedWith: number[];
}

export function buildSpatialGrid(boxes: BuildingBox[], cellSize = 12): SpatialGrid {
  const cells = new Map<string, BuildingBox[]>();

  for (const box of boxes) {
    const minX = cellCoord(box.minX, cellSize);
    const maxX = cellCoord(box.maxX, cellSize);
    const minZ = cellCoord(box.minZ, cellSize);
    const maxZ = cellCoord(box.maxZ, cellSize);

    for (let x = minX; x <= maxX; x += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        const key = cellKey(x, z);
        const bucket = cells.get(key) ?? [];
        bucket.push(box);
        cells.set(key, bucket);
      }
    }
  }

  return { cellSize, cells };
}

export function querySpatialGrid(grid: SpatialGrid, x: number, z: number, radius: number): BuildingBox[] {
  const minX = cellCoord(x - radius, grid.cellSize);
  const maxX = cellCoord(x + radius, grid.cellSize);
  const minZ = cellCoord(z - radius, grid.cellSize);
  const maxZ = cellCoord(z + radius, grid.cellSize);
  const seen = new Set<number>();
  const result: BuildingBox[] = [];

  for (let cellX = minX; cellX <= maxX; cellX += 1) {
    for (let cellZ = minZ; cellZ <= maxZ; cellZ += 1) {
      for (const box of grid.cells.get(cellKey(cellX, cellZ)) ?? []) {
        if (!seen.has(box.fileId) && boxIntersectsCircle(box, x, z, radius)) {
          seen.add(box.fileId);
          result.push(box);
        }
      }
    }
  }

  return result.sort((a, b) => a.fileId - b.fileId);
}

export function resolveDroneCollision(
  position: Vector3Like,
  velocity: Vector3Like,
  boxes: BuildingBox[],
  radius: number,
): CollisionResult {
  const nextPosition = { ...position };
  const nextVelocity = { ...velocity };
  const collidedWith: number[] = [];

  for (const box of boxes) {
    if (nextPosition.y + radius < box.minY || nextPosition.y - radius > box.maxY) {
      continue;
    }

    const resolution = collisionResolution(nextPosition, box, radius);
    if (!resolution) {
      continue;
    }

    nextPosition.x += resolution.normalX * resolution.depth;
    nextPosition.z += resolution.normalZ * resolution.depth;

    const inwardSpeed = nextVelocity.x * resolution.normalX + nextVelocity.z * resolution.normalZ;
    if (inwardSpeed < 0) {
      nextVelocity.x -= inwardSpeed * resolution.normalX;
      nextVelocity.z -= inwardSpeed * resolution.normalZ;
    }

    collidedWith.push(box.fileId);
  }

  return { position: nextPosition, velocity: nextVelocity, collidedWith };
}

function collisionResolution(position: Vector3Like, box: BuildingBox, radius: number) {
  const closestX = clamp(position.x, box.minX, box.maxX);
  const closestZ = clamp(position.z, box.minZ, box.maxZ);
  let dx = position.x - closestX;
  let dz = position.z - closestZ;
  let distance = Math.hypot(dx, dz);

  if (distance === 0) {
    const distances = [
      { normalX: -1, normalZ: 0, depth: position.x - box.minX + radius },
      { normalX: 1, normalZ: 0, depth: box.maxX - position.x + radius },
      { normalX: 0, normalZ: -1, depth: position.z - box.minZ + radius },
      { normalX: 0, normalZ: 1, depth: box.maxZ - position.z + radius },
    ].sort((a, b) => a.depth - b.depth);
    return distances[0]!;
  }

  if (distance >= radius) {
    return null;
  }

  dx /= distance;
  dz /= distance;
  distance = radius - distance;
  return { normalX: dx, normalZ: dz, depth: distance };
}

function boxIntersectsCircle(box: BuildingBox, x: number, z: number, radius: number): boolean {
  const closestX = clamp(x, box.minX, box.maxX);
  const closestZ = clamp(z, box.minZ, box.maxZ);
  return Math.hypot(x - closestX, z - closestZ) <= radius;
}

function cellCoord(value: number, cellSize: number): number {
  return Math.floor(value / cellSize);
}

function cellKey(x: number, z: number): string {
  return `${x}:${z}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
