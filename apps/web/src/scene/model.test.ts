import { describe, expect, it } from "vitest";
import type { CityData, FileNode } from "@canopy/shared";
import { buildingHeight, fileById, fileCenter, sceneWorldSize } from "./model";

const file: FileNode = {
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

describe("scene model helpers", () => {
  it("maps lines of code to a stable logarithmic building height", () => {
    expect(buildingHeight(0)).toBe(0.3);
    expect(buildingHeight(127)).toBeCloseTo(8.4, 5);
  });

  it("uses layout file centers directly as scene coordinates", () => {
    expect(fileCenter(file)).toEqual([10, 30]);
  });

  it("derives a world size from centered city bounds", () => {
    const city = {
      files: [
        { ...file, x: -54, z: 0, w: 12, d: 8 },
        { ...file, id: 2, x: 35, z: 53, w: 10, d: 14 },
      ],
    } as CityData;

    expect(sceneWorldSize(city)).toBe(120);
  });

  it("finds files by id instead of assuming ids are array indexes", () => {
    const files = [
      { ...file, id: 10, name: "first.ts" },
      { ...file, id: 42, name: "selected.ts" },
    ];

    expect(fileById(files, 42)?.name).toBe("selected.ts");
  });
});
