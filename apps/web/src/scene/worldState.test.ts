import { describe, expect, it } from "vitest";
import type { CityData, FileNode } from "@canopy/shared";
import { buildingHeight } from "./model";
import { canopyWorldState, syncCityWorldState, updateLiveBuildingHeight } from "./worldState";

const baseFile: FileNode = {
  id: 1,
  path: "src/App.tsx",
  name: "App.tsx",
  language: "typescript",
  loc: 127,
  functionCount: 4,
  complexity: 7,
  maxFunctionComplexity: 3,
  churn: 12,
  authorCount: 2,
  lastModified: "2026-10-10T00:00:00.000Z",
  risk: 0.3,
  x: 10,
  z: 30,
  w: 8,
  d: 12,
};

function city(files: FileNode[]): CityData {
  return {
    version: 1,
    repo: {
      url: "https://github.com/example/repo",
      name: "repo",
      headSha: "abc",
      analyzedAt: "2026-10-10T00:00:00.000Z",
      truncated: false,
    },
    stats: {
      fileCount: files.length,
      totalLoc: files.reduce((sum, file) => sum + file.loc, 0),
      commitCount: 0,
      authorCount: 0,
      languages: {},
    },
    files,
    districts: [],
    edges: [
      { from: 1, to: 2, weight: 1 },
      { from: 3, to: 2, weight: 2 },
    ],
    timeline: null,
  };
}

describe("world state", () => {
  it("syncs building boxes and imported-by counts from city data", () => {
    syncCityWorldState(city([
      baseFile,
      { ...baseFile, id: 2, path: "src/lib.ts", name: "lib.ts", x: -4, z: 8, w: 6, d: 4 },
      { ...baseFile, id: 3, path: "src/api.ts", name: "api.ts", x: 14, z: -8, w: 10, d: 8 },
    ]));

    expect(canopyWorldState.buildingBoxes).toHaveLength(3);
    expect(canopyWorldState.importedByCounts.get(2)).toBe(2);
    expect(canopyWorldState.importedByCounts.get(1)).toBe(0);
    expect(canopyWorldState.liveHeights.get(1)).toBeCloseTo(buildingHeight(baseFile.loc), 5);
  });

  it("updates a synced building box when the live height changes", () => {
    syncCityWorldState(city([baseFile]));
    updateLiveBuildingHeight(baseFile.id, 21);

    expect(canopyWorldState.liveHeights.get(baseFile.id)).toBe(21);
    expect(canopyWorldState.buildingBoxes[0]).toMatchObject({
      fileId: baseFile.id,
      minY: 0,
      maxY: 21,
    });
  });
});
