import type { CityData, FileNode } from "@canopy/shared";

export interface DependencyIndex {
  importsByFile: Map<number, number[]>;
  importedByFile: Map<number, number[]>;
}

export interface FileDependencies {
  imports: FileNode[];
  importedBy: FileNode[];
}

export function buildDependencyIndex(city: CityData): DependencyIndex {
  const existingIds = new Set(city.files.map((file) => file.id));
  const importsByFile = new Map<number, Set<number>>();
  const importedByFile = new Map<number, Set<number>>();

  for (const edge of city.edges) {
    if (!existingIds.has(edge.from) || !existingIds.has(edge.to)) {
      continue;
    }

    addToSet(importsByFile, edge.from, edge.to);
    addToSet(importedByFile, edge.to, edge.from);
  }

  return {
    importsByFile: freezeIndex(importsByFile, city.files),
    importedByFile: freezeIndex(importedByFile, city.files),
  };
}

export function dependenciesForFile(
  city: CityData,
  fileId: number,
  index: DependencyIndex = buildDependencyIndex(city),
): FileDependencies {
  const fileById = new Map(city.files.map((file) => [file.id, file]));

  return {
    imports: filesForIds(index.importsByFile.get(fileId) ?? [], fileById),
    importedBy: filesForIds(index.importedByFile.get(fileId) ?? [], fileById),
  };
}

function addToSet(index: Map<number, Set<number>>, from: number, to: number) {
  const current = index.get(from);
  if (current) {
    current.add(to);
  } else {
    index.set(from, new Set([to]));
  }
}

function freezeIndex(index: Map<number, Set<number>>, files: FileNode[]): Map<number, number[]> {
  const pathById = new Map(files.map((file) => [file.id, file.path]));
  const frozen = new Map<number, number[]>();
  for (const [fileId, ids] of index) {
    frozen.set(fileId, [...ids].sort((a, b) => (pathById.get(a) ?? "").localeCompare(pathById.get(b) ?? "")));
  }
  return frozen;
}

function filesForIds(ids: number[], fileById: Map<number, FileNode>): FileNode[] {
  return ids.flatMap((id) => {
    const file = fileById.get(id);
    return file ? [file] : [];
  });
}
