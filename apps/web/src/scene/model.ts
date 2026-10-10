import type { CityData, FileNode } from "@canopy/shared";

export function buildingHeight(loc: number): number {
  return Math.max(0.3, Math.log2(loc + 1) * 1.2);
}

export function fileCenter(file: FileNode): [number, number] {
  return [file.x, file.z];
}

export function fileById(files: FileNode[], id: number): FileNode | undefined {
  return files.find((file) => file.id === id);
}

export function sceneWorldSize(city: CityData): number {
  const maxExtent = city.files.reduce((extent, file) => {
    const xExtent = Math.max(Math.abs(file.x - file.w / 2), Math.abs(file.x + file.w / 2));
    const zExtent = Math.max(Math.abs(file.z - file.d / 2), Math.abs(file.z + file.d / 2));
    return Math.max(extent, xExtent, zExtent);
  }, 0);

  return Math.ceil(maxExtent * 2);
}
