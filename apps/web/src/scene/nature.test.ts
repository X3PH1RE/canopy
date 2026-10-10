import { describe, expect, it } from "vitest";
import type { CityData, FileNode } from "@canopy/shared";
import { solarPanelsForFiles, solarPanelY, treePlacementsForCity } from "./nature";

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
  x: 0,
  z: 0,
  w: 8,
  d: 8,
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
    edges: [],
    timeline: null,
  };
}

describe("nature placement", () => {
  it("places trees deterministically outside building footprints", () => {
    const data = city([
      baseFile,
      { ...baseFile, id: 2, x: 20, z: 0 },
      { ...baseFile, id: 3, x: -18, z: 16 },
    ]);

    const first = treePlacementsForCity(data, 80);
    const second = treePlacementsForCity(data, 80);

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(10);
    expect(first.length).toBeLessThanOrEqual(96);
    expect(first.every((tree) => Math.hypot(tree.x - baseFile.x, tree.z - baseFile.z) > 7)).toBe(true);
  });

  it("chooses solar panels for large high-LOC roofs", () => {
    const panels = solarPanelsForFiles([
      { ...baseFile, id: 1, loc: 20, w: 10, d: 10 },
      { ...baseFile, id: 2, loc: 1600, x: 20, z: 4, w: 12, d: 9 },
      { ...baseFile, id: 3, loc: 900, x: -20, z: -4, w: 4, d: 4 },
    ]);

    expect(panels.map((panel) => panel.fileId)).toEqual([2]);
    expect(panels[0]).toMatchObject({ x: 20, z: 4, width: 6 });
  });

  it("uses live building height for solar panel placement", () => {
    expect(solarPanelY(4)).toBe(4.16);
  });
});
