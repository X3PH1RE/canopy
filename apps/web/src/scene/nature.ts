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

export interface Pond {
  x: number;
  z: number;
  radius: number;
}

export function pondsForCity(city: CityData, worldSize: number): Pond[] {
  const ponds: Pond[] = [];
  const half = worldSize / 2 + 6;
  for (let attempt = 0; attempt < 60 && ponds.length < 3; attempt += 1) {
    const seed = hash(`${city.repo.name}:pond:${attempt}`);
    const x = (unit(seed) * 2 - 1) * half;
    const z = (unit(seed * 1664525 + 1013904223) * 2 - 1) * half;
    const radius = round(2.4 + unit(seed * 31) * 1.8);
    if (city.files.some((file) => insideBuildingBuffer(file, x, z, radius + 1.5))) {
      continue;
    }
    if (ponds.some((pond) => Math.hypot(pond.x - x, pond.z - z) < pond.radius + radius + 6)) {
      continue;
    }
    ponds.push({ x: round(x), z: round(z), radius });
  }
  return ponds;
}

export function groundcoverForCity(
  city: CityData,
  worldSize: number,
  count: number,
  tag: string,
  ponds: Pond[],
): TreePlacement[] {
  const half = worldSize / 2 + 8;
  const spots: TreePlacement[] = [];
  for (let attempt = 0; attempt < count * 8 && spots.length < count; attempt += 1) {
    const seed = hash(`${city.repo.name}:${tag}:${attempt}`);
    const x = (unit(seed) * 2 - 1) * half;
    const z = (unit(seed * 1664525 + 1013904223) * 2 - 1) * half;
    if (city.files.some((file) => insideBuildingBuffer(file, x, z, 1.1))) {
      continue;
    }
    if (ponds.some((pond) => Math.hypot(pond.x - x, pond.z - z) < pond.radius + 1)) {
      continue;
    }
    spots.push({ x: round(x), z: round(z), scale: round(0.6 + unit(seed * 31) * 0.8), hue: round(unit(seed * 131)) });
  }
  return spots;
}
