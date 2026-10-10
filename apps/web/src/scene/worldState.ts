import type { CityData } from "@canopy/shared";
import { buildingHeight } from "./model";

export interface BuildingBox {
  fileId: number;
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface DroneWorldState {
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
}

export interface CanopyWorldState {
  buildingBoxes: BuildingBox[];
  liveHeights: Map<number, number>;
  importedByCounts: Map<number, number>;
  drone: DroneWorldState;
}

export const canopyWorldState: CanopyWorldState = {
  buildingBoxes: [],
  liveHeights: new Map(),
  importedByCounts: new Map(),
  drone: { x: 0, y: 8, z: 0, yaw: 0, speed: 0 },
};

export function syncCityWorldState(city: CityData): void {
  canopyWorldState.liveHeights = new Map();
  canopyWorldState.importedByCounts = new Map(city.files.map((file) => [file.id, 0]));
  canopyWorldState.buildingBoxes = city.files.map((file) => {
    const height = buildingHeight(file.loc);
    canopyWorldState.liveHeights.set(file.id, height);
    return makeBuildingBox(file.id, file.x, file.z, file.w * 0.72, file.d * 0.72, height);
  });

  for (const edge of city.edges) {
    if (canopyWorldState.importedByCounts.has(edge.to)) {
      canopyWorldState.importedByCounts.set(edge.to, (canopyWorldState.importedByCounts.get(edge.to) ?? 0) + 1);
    }
  }
}

export function updateLiveBuildingHeight(fileId: number, height: number): void {
  const clampedHeight = Math.max(0.3, height);
  canopyWorldState.liveHeights.set(fileId, clampedHeight);

  const box = canopyWorldState.buildingBoxes.find((candidate) => candidate.fileId === fileId);
  if (box) {
    box.maxY = clampedHeight;
  }
}

function makeBuildingBox(fileId: number, x: number, z: number, width: number, depth: number, height: number): BuildingBox {
  const halfW = width / 2;
  const halfD = depth / 2;
  return {
    fileId,
    x,
    z,
    halfW,
    halfD,
    minX: x - halfW,
    maxX: x + halfW,
    minY: 0,
    maxY: height,
    minZ: z - halfD,
    maxZ: z + halfD,
  };
}
