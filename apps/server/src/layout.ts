import { hierarchy, treemap } from "d3-hierarchy";
import type { District } from "@canopy/shared";

export interface LayoutInputFile {
  path: string;
  loc: number;
  functionCount: number;
}

export interface LayoutFile {
  path: string;
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface LayoutOptions {
  size?: number;
  padding?: number;
}

export interface LayoutResult {
  files: LayoutFile[];
  districts: District[];
}

interface TreeNode {
  path: string;
  children?: TreeNode[];
  file?: LayoutInputFile;
}

export function layoutCity(inputFiles: LayoutInputFile[], options: LayoutOptions = {}): LayoutResult {
  const size = options.size ?? 120;
  const padding = options.padding ?? 1.2;
  const sortedFiles = [...inputFiles].sort((a, b) => a.path.localeCompare(b.path));
  const rootNode: TreeNode = {
    path: "",
    children: sortedFiles.map((file) => ({
      path: file.path,
      file,
    })),
  };

  const root = hierarchy(rootNode)
    .sum((node) => node.file ? Math.max(1, node.file.functionCount + 2) : 0)
    .sort((a, b) => a.data.path.localeCompare(b.data.path));

  const laidOut = treemap<TreeNode>()
    .size([size, size])
    .paddingInner(padding)
    .paddingOuter(padding)
    .round(false)(root);

  const half = size / 2;
  const files: LayoutFile[] = [];
  const districtBounds = new Map<string, { depth: number; minX: number; maxX: number; minZ: number; maxZ: number }>();

  for (const node of laidOut.descendants()) {
    if (!node.data.file) {
      continue;
    }

    const w = Math.max(0, node.x1 - node.x0);
    const d = Math.max(0, node.y1 - node.y0);
    const x = node.x0 + w / 2 - half;
    const z = node.y0 + d / 2 - half;

    files.push({ path: node.data.file.path, x, z, w, d });
    addDistrictBounds(districtBounds, node.data.file.path, { x, z, w, d });
  }

  const districts: District[] = [];
  for (const [path, bounds] of districtBounds) {
    const w = bounds.maxX - bounds.minX;
    const d = bounds.maxZ - bounds.minZ;
    districts.push({
      path,
      depth: bounds.depth,
      x: bounds.minX + w / 2,
      z: bounds.minZ + d / 2,
      w,
      d,
    });
  }

  files.sort((a, b) => a.path.localeCompare(b.path));
  districts.sort((a, b) => a.path.localeCompare(b.path));

  return { files, districts };
}

function addDistrictBounds(
  districts: Map<string, { depth: number; minX: number; maxX: number; minZ: number; maxZ: number }>,
  filePath: string,
  rect: { x: number; z: number; w: number; d: number },
) {
  const parts = filePath.split("/").filter(Boolean);
  const minX = rect.x - rect.w / 2;
  const maxX = rect.x + rect.w / 2;
  const minZ = rect.z - rect.d / 2;
  const maxZ = rect.z + rect.d / 2;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const path = parts.slice(0, index + 1).join("/");
    const current = districts.get(path);

    if (!current) {
      districts.set(path, { depth: index, minX, maxX, minZ, maxZ });
      continue;
    }

    current.minX = Math.min(current.minX, minX);
    current.maxX = Math.max(current.maxX, maxX);
    current.minZ = Math.min(current.minZ, minZ);
    current.maxZ = Math.max(current.maxZ, maxZ);
  }
}
