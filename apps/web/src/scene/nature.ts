import type { CityData, FileNode } from "@canopy/shared";
import { buildingHeight } from "./model";

export interface TreePlacement {
  x: number;
  z: number;
  scale: number;
  hue: number;
}

export interface SolarPanelPlacement {
  fileId: number;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
}

export function treePlacementsForCity(city: CityData, worldSize: number): TreePlacement[] {
  const count = Math.min(96, Math.max(18, Math.round(city.files.length * 0.32)));
  const half = worldSize / 2 + 5;
  const trees: TreePlacement[] = [];
  let attempts = 0;

  while (trees.length < count && attempts < count * 10) {
    const seed = hash(`${city.repo.name}:${attempts}:${city.files.length}`);
    const x = (unit(seed) * 2 - 1) * half;
    const z = (unit(seed * 1664525 + 1013904223) * 2 - 1) * half;
    attempts += 1;

    if (city.files.some((file) => insideBuildingBuffer(file, x, z, 3.2))) {
      continue;
    }

    trees.push({
      x: round(x),
      z: round(z),
      scale: round(0.72 + unit(seed * 31) * 0.56),
      hue: round(unit(seed * 131)),
    });
  }

  return trees;
}

export function solarPanelsForFiles(files: FileNode[]): SolarPanelPlacement[] {
  return [...files]
    .filter((file) => file.loc >= 700 && file.w >= 7 && file.d >= 7)
    .sort((a, b) => b.loc - a.loc || a.id - b.id)
    .slice(0, 48)
    .map((file) => ({
      fileId: file.id,
      x: file.x,
      y: solarPanelY(buildingHeight(file.loc)),
      z: file.z,
      width: round(Math.max(2.2, file.w * 0.5)),
      depth: round(Math.max(1.4, file.d * 0.32)),
    }));
}

export function solarPanelY(liveHeight: number): number {
  return round(liveHeight + 0.16);
}

function insideBuildingBuffer(file: FileNode, x: number, z: number, buffer: number): boolean {
  return (
    x >= file.x - file.w / 2 - buffer &&
    x <= file.x + file.w / 2 + buffer &&
    z >= file.z - file.d / 2 - buffer &&
    z <= file.z + file.d / 2 + buffer
  );
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function unit(seed: number): number {
  return ((seed >>> 0) % 10_000) / 10_000;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
