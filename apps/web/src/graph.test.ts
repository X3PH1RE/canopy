import { describe, expect, it } from "vitest";
import type { CityData, FileNode } from "@canopy/shared";
import { buildDependencyIndex, dependenciesForFile } from "./graph";

const baseFile: FileNode = {
  id: 0,
  path: "src/a.ts",
  name: "a.ts",
  language: "typescript",
  loc: 10,
  functionCount: 1,
  complexity: 1,
  maxFunctionComplexity: 1,
  churn: 0,
  authorCount: 1,
  lastModified: "2026-10-10T00:00:00.000Z",
  risk: 0,
  x: 0,
  z: 0,
  w: 1,
  d: 1,
};

describe("dependency graph helpers", () => {
  it("returns selected-file imports and imported-by files with stable ordering", () => {
    const city = cityWithEdges([
      { from: 0, to: 2, weight: 1 },
      { from: 0, to: 1, weight: 2 },
      { from: 3, to: 0, weight: 1 },
      { from: 2, to: 0, weight: 1 },
    ]);

    const deps = dependenciesForFile(city, 0, buildDependencyIndex(city));

    expect(deps.imports.map((file) => file.path)).toEqual(["src/b.ts", "src/c.ts"]);
    expect(deps.importedBy.map((file) => file.path)).toEqual(["src/c.ts", "src/d.ts"]);
  });

  it("dedupes duplicate edges and ignores missing endpoints", () => {
    const city = cityWithEdges([
      { from: 0, to: 1, weight: 1 },
      { from: 0, to: 1, weight: 3 },
      { from: 0, to: 99, weight: 1 },
      { from: 88, to: 0, weight: 1 },
      { from: 2, to: 0, weight: 1 },
    ]);

    const deps = dependenciesForFile(city, 0, buildDependencyIndex(city));

    expect(deps.imports.map((file) => file.id)).toEqual([1]);
    expect(deps.importedBy.map((file) => file.id)).toEqual([2]);
  });

  it("returns empty lists for files with no dependency edges", () => {
    const city = cityWithEdges([]);

    expect(dependenciesForFile(city, 3, buildDependencyIndex(city))).toEqual({
      imports: [],
      importedBy: [],
    });
  });
});

function cityWithEdges(edges: CityData["edges"]): CityData {
  const files = ["src/a.ts", "src/b.ts", "src/c.ts", "src/d.ts"].map((filePath, id) => ({
    ...baseFile,
    id,
    path: filePath,
    name: filePath.split("/").at(-1) ?? filePath,
  }));

  return {
    version: 1,
    repo: {
      url: "https://github.com/example/repo",
      name: "example/repo",
      headSha: "abc",
      analyzedAt: "2026-10-10T00:00:00.000Z",
      truncated: false,
    },
    stats: {
      fileCount: files.length,
      totalLoc: 40,
      commitCount: 0,
      authorCount: 0,
      languages: { typescript: files.length },
    },
    files,
    districts: [],
    edges,
    timeline: null,
  };
}
